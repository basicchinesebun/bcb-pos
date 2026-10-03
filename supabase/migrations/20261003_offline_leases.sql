-- Selling through an outage that can last a whole day.
--
-- Two things in this app are decided by the database and not by the till: the
-- queue number (next_qnum) and the stock (take_stock), both under a row lock.
-- That is what stops two tills selling the same bun. With no connection the
-- till cannot ask, so it has to already be holding the answer — it leases a
-- block of queue numbers and a slice of the shelf while it still has a line to
-- the database, and sells out of those. Nothing is guessed, so when the line
-- comes back there is nothing to reconcile, only orders to deliver.

alter table orders add column if not exists client_id uuid;
create unique index if not exists orders_client_id_key on orders (client_id) where client_id is not null;

create table if not exists qnum_leases (
  id bigserial primary key, device_id text not null,
  key text not null default 'next_queue_walkin',
  from_num integer not null, to_num integer not null,
  created_at timestamptz not null default now(), expires_at timestamptz not null);
create index if not exists qnum_leases_device_idx on qnum_leases (device_id, expires_at);

create table if not exists stock_leases (
  id bigserial primary key, device_id text not null, key text not null,
  held jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), expires_at timestamptz not null);
create unique index if not exists stock_leases_device_key on stock_leases (device_id, key);

alter table qnum_leases enable row level security;
alter table stock_leases enable row level security;
create policy qnum_leases_all on qnum_leases for all using (true) with check (true);
create policy stock_leases_all on stock_leases for all using (true) with check (true);

-- Advance the counter by the whole block under the same lock next_qnum uses,
-- so a second till asking at the same moment starts after this block.
create or replace function lease_qnums(p_device text, p_count integer, p_key text default 'next_queue_walkin', p_hours integer default 36)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare cur integer; start_num integer;
begin
  if p_count < 1 or p_count > 500 then return jsonb_build_object('ok', false, 'reason', 'bad_count'); end if;
  select coalesce(nullif(value,'')::integer,1) into cur from shop_config where key=p_key for update;
  if cur is null then
    insert into shop_config (key, value) values (p_key,'1') on conflict (key) do nothing;
    select coalesce(nullif(value,'')::integer,1) into cur from shop_config where key=p_key for update;
  end if;
  start_num := cur;
  update shop_config set value=(cur+p_count)::text where key=p_key;
  insert into qnum_leases (device_id, key, from_num, to_num, expires_at)
    values (p_device, p_key, start_num, start_num+p_count-1, now()+make_interval(hours=>p_hours));
  return jsonb_build_object('ok',true,'from',start_num,'to',start_num+p_count-1);
end $$;

-- Top this device's holding up to p_target per menu, taking the difference off
-- the shelf. Whatever cannot be taken is simply not held: the shelf is the
-- limit, which is the whole point.
create or replace function lease_stock(p_device text, p_key text, p_target jsonb, p_hours integer default 36)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare shelf jsonb; held jsonb; k text; want integer; have integer; avail integer; take integer;
        new_held jsonb := '{}'::jsonb; new_shelf jsonb;
begin
  select coalesce(value::jsonb,'[]'::jsonb) into shelf from shop_config where key=p_key for update;
  if shelf is null then return jsonb_build_object('ok',false,'reason','no_stock_key'); end if;
  select coalesce(sl.held,'{}'::jsonb) into held from stock_leases sl where sl.device_id=p_device and sl.key=p_key for update;
  held := coalesce(held,'{}'::jsonb);
  new_shelf := shelf;
  for k in select jsonb_object_keys(p_target) loop
    want := coalesce((p_target->>k)::integer,0);
    have := coalesce((held->>k)::integer,0);
    avail := coalesce((new_shelf->k::integer)::integer,0);
    take := least(greatest(want-have,0), greatest(avail,0));
    new_shelf := jsonb_set(new_shelf, array[k], to_jsonb(avail-take));
    new_held := jsonb_set(new_held, array[k], to_jsonb(have+take));
  end loop;
  for k in select jsonb_object_keys(held) loop
    if not (new_held ? k) then new_held := jsonb_set(new_held, array[k], held->k); end if;
  end loop;
  update shop_config set value=new_shelf::text where key=p_key;
  insert into stock_leases (device_id, key, held, expires_at)
    values (p_device, p_key, new_held, now()+make_interval(hours=>p_hours))
  on conflict (device_id, key) do update set held=excluded.held, updated_at=now(), expires_at=excluded.expires_at;
  return jsonb_build_object('ok',true,'held',new_held,'stock',new_shelf);
end $$;

-- Give back what is still held, minus what was actually sold offline.
create or replace function release_stock_lease(p_device text, p_key text, p_used jsonb)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare shelf jsonb; held jsonb; k text; back integer; q integer;
begin
  select coalesce(sl.held,'{}'::jsonb) into held from stock_leases sl where sl.device_id=p_device and sl.key=p_key for update;
  if held is null then return jsonb_build_object('ok',true,'nothing_held',true); end if;
  select coalesce(value::jsonb,'[]'::jsonb) into shelf from shop_config where key=p_key for update;
  for k in select jsonb_object_keys(held) loop
    back := greatest(coalesce((held->>k)::integer,0) - coalesce((p_used->>k)::integer,0), 0);
    q := coalesce((shelf->k::integer)::integer,0);
    shelf := jsonb_set(shelf, array[k], to_jsonb(q+back));
  end loop;
  update shop_config set value=shelf::text where key=p_key;
  update stock_leases set held='{}'::jsonb, updated_at=now(), expires_at=now() where device_id=p_device and key=p_key;
  return jsonb_build_object('ok',true,'stock',shelf);
end $$;

-- A till that dies mid-outage would otherwise hold its slice of the shelf for
-- ever. Anything past its expiry goes back.
create or replace function sweep_expired_leases() returns integer
language plpgsql security definer set search_path = public, pg_temp as $$
declare r record; n integer := 0;
begin
  for r in select device_id, key from stock_leases where expires_at < now() and held <> '{}'::jsonb loop
    perform release_stock_lease(r.device_id, r.key, '{}'::jsonb);
    n := n + 1;
  end loop;
  return n;
end $$;

grant execute on function lease_qnums(text,integer,text,integer) to anon, authenticated;
grant execute on function lease_stock(text,text,jsonb,integer) to anon, authenticated;
grant execute on function release_stock_lease(text,text,jsonb) to anon, authenticated;
grant execute on function sweep_expired_leases() to anon, authenticated;
