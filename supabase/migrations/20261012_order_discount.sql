-- Buns get squashed. The shop would rather sell a dented one cheap than bin
-- it, and until now there was no way to ring that up: the till could only
-- charge list price, so a discounted sale was either recorded at full price
-- (overstating the takings) or not recorded at all.
--
-- The split that matters: `total` stays "what the customer actually paid", so
-- every figure already reading `total` — the day's takings, the filter money,
-- the CSV — stays correct with no change. `discount` is what was given away,
-- kept separately so the shop can see what damage costs it over a month.
-- The list-price amount is not stored; it is `total + discount`.
--
-- items[].price and items[].sub stay at LIST price on purpose. A line's price
-- is what that bun is worth; the discount is a fact about the sale, not about
-- the menu. Anything that re-sums items therefore gets the gross, which is
-- why the report shows the discount on its own line rather than quietly
-- spreading it across the menus.
alter table orders add column if not exists discount integer not null default 0;
alter table orders add column if not exists discount_reason text;

-- Nothing can be discounted into a refund, and a discount cannot be negative
-- (that would be a surcharge wearing the wrong name). Enforced here rather
-- than only in the till, because the till is not the only thing that can
-- write a row — the offline outbox does too.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_discount_sane'
  ) then
    alter table orders add constraint orders_discount_sane
      check (discount >= 0 and total >= 0);
  end if;
end $$;
