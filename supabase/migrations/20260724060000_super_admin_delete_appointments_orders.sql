-- Neither appointments nor orders had a DELETE policy at all before this
-- -- RLS was silently denying delete to everyone, including admins, since
-- an enabled-RLS table with no matching policy for a command denies it by
-- default. Gated on is_super_admin() specifically (not is_admin()) since
-- deleting a real booking/order is destructive and hard to reverse —
-- same bar as changing someone's role, the only other super_admin-only
-- action in this codebase (see prevent_role_self_escalation()).
-- order_items already cascades on order delete (on delete cascade, see
-- setup.sql), so deleting an order cleans up its line items too.
drop policy if exists appointments_super_admin_delete on public.appointments;
create policy appointments_super_admin_delete on public.appointments
  for delete using (public.is_super_admin());

drop policy if exists orders_super_admin_delete on public.orders;
create policy orders_super_admin_delete on public.orders
  for delete using (public.is_super_admin());

grant delete on public.appointments, public.orders to authenticated;
