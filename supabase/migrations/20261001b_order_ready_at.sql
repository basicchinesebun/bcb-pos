-- Cooked and collected are two different moments, and the shop uses both
-- screens depending on the day. The kitchen's ✓ used to set done, which took
-- the order off the till's board before anyone had handed the bag over — so
-- on a kitchen-driven day no handover was ever recorded.
--
-- ready_at is the kitchen's ✓. done/picked_up_at stays the counter's.
alter table orders add column if not exists ready_at timestamptz;

-- Anything already finished was, by definition, cooked.
update orders
   set ready_at = coalesce(done_at, created_at)
 where done = true and cancelled = false and ready_at is null;
