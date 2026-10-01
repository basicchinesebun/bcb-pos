-- Handover at the counter, recorded as its own fact.
--
-- "done" could not answer "did this customer already take their buns?" — the
-- kitchen screen sets it when the food comes out of the steamer and the till
-- sets it at the counter, so a finished order and a collected order look
-- identical. A customer collected the same order twice and there was no way
-- to tell afterwards.
--
-- picked_up_at is the FIRST handover and is never overwritten: it is the
-- evidence. picked_up_count counts every handover, so a second one shows up
-- as a number rather than quietly replacing the first timestamp.
alter table orders add column if not exists picked_up_at timestamptz;
alter table orders add column if not exists picked_up_by text;
alter table orders add column if not exists picked_up_count integer not null default 0;

create index if not exists orders_picked_up_at_idx on orders (picked_up_at);

-- The till must not be the thing that decides. Two tills, or one staff member
-- tapping twice while the screen is still catching up, both read "not picked
-- up yet" and both hand over. The row lock makes the second caller wait and
-- then see the first one's write, exactly like take_stock does for the shelf.
create or replace function pickup_order(
  p_id bigint,
  p_by text default null,
  p_force boolean default false
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  r orders%rowtype;
  now_ts timestamptz := now();
begin
  select * into r from orders where id = p_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  if r.cancelled or r.status in ('rejected', 'blocked') then
    return jsonb_build_object('ok', false, 'reason', 'void', 'status', r.status);
  end if;

  -- Already collected, and nobody has said to hand it over anyway: change
  -- nothing and tell the till when and by whom, so it can put that on screen.
  if r.picked_up_at is not null and not p_force then
    return jsonb_build_object(
      'ok', false, 'reason', 'already',
      'qnum', r.qnum,
      'at', r.picked_up_at,
      'by', r.picked_up_by,
      'count', r.picked_up_count
    );
  end if;

  update orders set
    picked_up_at    = coalesce(picked_up_at, now_ts),
    picked_up_by    = coalesce(p_by, picked_up_by),
    picked_up_count = picked_up_count + 1,
    done            = true,
    done_at         = coalesce(done_at, now_ts)
  where id = p_id;

  return jsonb_build_object(
    'ok', true,
    'at', coalesce(r.picked_up_at, now_ts),
    'count', r.picked_up_count + 1,
    'repeat', r.picked_up_at is not null
  );
end $$;

revoke all on function pickup_order(bigint, text, boolean) from public;
grant execute on function pickup_order(bigint, text, boolean) to anon, authenticated;

-- Everything already finished before this feature existed counts as collected,
-- otherwise every historical order would read "not collected yet" forever.
update orders
   set picked_up_at = coalesce(done_at, created_at),
       picked_up_count = 1
 where done = true and cancelled = false and picked_up_at is null;
