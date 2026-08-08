-- expire_stock_reservations() (setup.sql) exists and works correctly, but
-- was never actually scheduled anywhere -- confirmed live: 16 expired
-- stock_reservations rows had accumulated uncleaned. available_stock()
-- already ignores expired rows either way (it filters on expires_at >
-- now()), so this was never a stock-accuracy bug, just an unbounded-growth
-- gap on the table. Scheduled the same way cancel_stale_pending_appointments
-- already is (direct SQL function call, no edge-function detour needed --
-- stock_reservations has no service-role-gated trigger like
-- appointments/orders do, confirmed via pg_trigger).
select cron.schedule('cleanup-stock-reservations', '*/5 * * * *', $$select public.expire_stock_reservations();$$);
