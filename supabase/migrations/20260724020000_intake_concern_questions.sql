-- Rebuilds the appointment intake form on top of the legacy site's
-- per-concern question bank (see src/lib/intakeQuestions.ts) instead of a
-- fixed set of 3 generic scale questions. `intake_concern` is which of the
-- 25 concerns the customer picked; `intake_answers` is their question/answer
-- pairs for that concern's question set.
--
-- The older intake_energy_level/intake_comfort_level/intake_self_perception
-- columns (added in 20260723040000) are left in place, not dropped —
-- existing submitted intake data stays readable, and the new form simply
-- stops writing to them. No customer-tampering trigger changes needed:
-- prevent_customer_appointment_tampering() (same migration) is a denylist
-- of protected columns, so any new column is customer-writable by default.
alter table public.appointments
  add column if not exists intake_concern text,
  add column if not exists intake_answers jsonb;
