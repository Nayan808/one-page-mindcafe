-- Found during a full connectivity audit: create-shiprocket-shipment was
-- fully coded and deployed (see the SHIPROCKET_SETUP.md work), but no
-- database trigger has ever actually called it -- every other notifier
-- (order-status-notifier, appointment-notifier, business-lead-notifier,
-- newsletter-welcome-notifier, expert-linked-notifier) uses the shared
-- notify_webhook() trigger function; this one was simply never given a
-- trigger. The function itself already guards internally (only acts on a
-- delivery order's first transition to 'confirmed'), so firing broadly on
-- every orders insert/update is safe and consistent with how every other
-- notify_webhook() trigger in this codebase is wired.
create trigger trg_notify_shiprocket_shipment
  after insert or update on public.orders
  for each row execute function public.notify_webhook('create-shiprocket-shipment');
