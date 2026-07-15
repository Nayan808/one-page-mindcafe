-- business_leads had select+insert grants/policies but no update path at
-- all, so the admin status dropdown (/admin/business-leads) silently did
-- nothing: the RPC call succeeded (RLS default-denies rather than errors)
-- but zero rows were ever affected, so the UI's optimistic update always
-- rolled back on refetch. Mirrors the orders_admin_update pattern.
grant update on public.business_leads to authenticated;

drop policy if exists business_leads_admin_update on public.business_leads;
create policy business_leads_admin_update on public.business_leads
  for update using (public.is_admin()) with check (public.is_admin());
