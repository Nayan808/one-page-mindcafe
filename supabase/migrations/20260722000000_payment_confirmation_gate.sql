-- Neither appointment-notifier nor the expert/admin "confirm" actions
-- ever checked payment_status: an expert or admin could flip status to
-- 'confirmed'/'completed' (firing the "your session is confirmed!" email
-- to both customer and expert) on a booking that had never actually been
-- paid for, and the "booking request received" email additionally fired
-- the instant the appointments row was inserted, before the Razorpay
-- checkout modal even opened. This trigger makes an unpaid confirmation
-- impossible at the DB layer — the real enforcement boundary, same as
-- prevent_staff_pin_change — rather than relying on every caller (expert
-- dashboard, admin panel, any future one) to remember the check
-- themselves. service_role is exempt so the payment webhook / edge
-- functions are never blocked by their own writes.
create or replace function public.prevent_unpaid_appointment_confirm() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and new.status in ('confirmed', 'completed')
     and new.payment_status <> 'paid'
     and auth.role() <> 'service_role' then
    raise exception 'Cannot confirm or complete an appointment before payment is confirmed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_unpaid_appointment_confirm on public.appointments;
create trigger trg_prevent_unpaid_appointment_confirm
  before update on public.appointments
  for each row execute function public.prevent_unpaid_appointment_confirm();

-- Same class of gap on the Feelz order side: /admin/orders lets status be
-- set to 'confirmed' (or any later fulfillment stage) via a plain UPDATE
-- that never checks payment_status, even though
-- confirm_order_and_decrement_stock — the only payment-webhook-driven
-- path to 'confirmed' for a razorpay order — sets status and
-- payment_status together specifically so the two can never drift apart.
-- Scoped to payment_method = 'razorpay' only: cash_on_pickup orders
-- legitimately reach 'confirmed' with payment_status = 'pending_cash' via
-- confirm_cash_order (payment happens at pickup, not upfront) — blocking
-- those too would break that flow. 'placed' and 'cancelled' stay exempt:
-- cancelling an unpaid/abandoned order is normal cleanup, not something
-- that should require payment first.
create or replace function public.prevent_unpaid_order_confirm() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     and new.status not in ('placed', 'cancelled')
     and new.payment_method = 'razorpay'
     and new.payment_status <> 'paid'
     and auth.role() <> 'service_role' then
    raise exception 'Cannot move an order past "placed" before payment is confirmed';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_unpaid_order_confirm on public.orders;
create trigger trg_prevent_unpaid_order_confirm
  before update on public.orders
  for each row execute function public.prevent_unpaid_order_confirm();
