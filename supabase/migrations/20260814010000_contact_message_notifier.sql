-- Alerts the team inbox on every new /contact submission, the same way
-- trg_notify_business_lead already does for the /business form —
-- contact_messages previously had no notifier at all and just sat in
-- /admin/contact-messages until someone happened to check.
-- Reuses the existing public.notify_webhook() trigger function.
drop trigger if exists trg_notify_contact_message on public.contact_messages;
create trigger trg_notify_contact_message
  after insert on public.contact_messages
  for each row execute function public.notify_webhook('contact-message-notifier');
