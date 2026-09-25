-- deduct_stock clamps a shortfall to zero and reports success, so five people
-- buying the last three buns all get an order. take_stock checks every line
-- under the row lock and changes nothing unless the whole order fits, so the
-- shelf decides instead of the copy of it each phone happens to be holding.
create or replace function public.take_stock(p_key text, p_deltas jsonb)
returns jsonb
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
  arr   jsonb;
  k     text;
  want  integer;
  cur   integer;
  short jsonb := '{}'::jsonb;
begin
  select value::jsonb into arr
    from public.shop_config
   where key = p_key
     for update;

  if arr is null then
    return jsonb_build_object('ok', false, 'reason', 'no_stock_row');
  end if;

  -- Check the whole order before touching anything: a partly-filled order
  -- would leave the customer paying for buns nobody can hand them.
  for k in select jsonb_object_keys(p_deltas) loop
    want := coalesce((p_deltas ->> k)::integer, 0);
    if want > 0 then
      cur := coalesce((arr ->> (k::integer))::integer, 0);
      if cur < want then
        short := jsonb_set(short, array[k], to_jsonb(cur));
      end if;
    end if;
  end loop;

  if short <> '{}'::jsonb then
    return jsonb_build_object('ok', false, 'reason', 'short', 'short', short, 'stock', arr);
  end if;

  -- A negative delta hands stock back, same as deduct_stock, so an edit that
  -- drops an item and adds another still works in one call.
  for k in select jsonb_object_keys(p_deltas) loop
    want := coalesce((p_deltas ->> k)::integer, 0);
    cur  := coalesce((arr ->> (k::integer))::integer, 0);
    arr  := jsonb_set(arr, array[k], to_jsonb(greatest(0, cur - want)));
  end loop;

  update public.shop_config set value = arr::text where key = p_key;
  return jsonb_build_object('ok', true, 'stock', arr);
end
$function$;

grant execute on function public.take_stock(text, jsonb) to anon, authenticated, service_role;
