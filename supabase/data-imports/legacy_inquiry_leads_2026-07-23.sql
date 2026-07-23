-- Legacy B2B/corporate wellness inquiry leads from mindcafe.app's
-- `inquiry` table (8 raw rows), imported into public.business_leads
-- alongside the earlier contact-form business_leads import.
--
-- Note on legacy schema drift: the `inquiry` table's `gender` column was
-- actually repurposed to hold the company/employer name in every real row
-- (verified from the actual INSERT data, not the CREATE TABLE definition)
-- -- the intended `company_size` column is NULL throughout. Mapped that
-- field to company_name here.
--
-- Excluded:
--  - inquiry_id 34: name 'Anonymous', email 'na' -- test/junk submission,
--    not a real lead.
--  - inquiry_id 51: exact duplicate of inquiry_id 50 (same name/email/phone),
--    submitted 3 seconds later -- an accidental double form-submit, kept
--    only the first.

-- legacy inquiry_id 35
insert into public.business_leads (company_name, contact_name, email, phone, message, status, created_at)
values ('Impetus Technologies', 'Aashi Joshi', 'aashi.joshi@impetus.com', '9009159645', 'Legacy corporate/B2B inquiry imported from mindcafe.app', 'new', '2024-02-27 11:06:53');

-- legacy inquiry_id 41
insert into public.business_leads (company_name, contact_name, email, phone, message, status, created_at)
values ('KARL STORZ Endoscopy India Pvt. Ltd', 'Nidhi Sharma', 'nidhi.sharma@karlstorz.com', '8448985117', 'Legacy corporate/B2B inquiry imported from mindcafe.app', 'new', '2024-04-23 10:06:23');

-- legacy inquiry_id 42
insert into public.business_leads (company_name, contact_name, email, phone, message, status, created_at)
values ('RBL Finserve Ltd.', 'Ruchika Bammi', 'ruchika.bammi@rblfinserve.com', '8989005004', 'Legacy corporate/B2B inquiry imported from mindcafe.app', 'new', '2024-05-09 17:20:18');

-- legacy inquiry_id 43
insert into public.business_leads (company_name, contact_name, email, phone, message, status, created_at)
values ('Guru Ram Dass Traders', 'Arvinder', 'arvinder@grdindia.com', '9953164399', 'Legacy corporate/B2B inquiry imported from mindcafe.app', 'new', '2024-07-10 06:51:57');

-- legacy inquiry_id 49
insert into public.business_leads (company_name, contact_name, email, phone, message, status, created_at)
values ('UCA CONSULTANTS PVT LTD', 'Hemant Raj Singh', 'marketing.u2ca@gmail.com', '9155765229', 'Legacy corporate/B2B inquiry imported from mindcafe.app', 'new', '2024-09-20 08:40:49');

-- legacy inquiry_id 50
insert into public.business_leads (company_name, contact_name, email, phone, message, status, created_at)
values ('Aiims Bathinda', 'Sunil Gora', 'sunilgora5555@gmail.com', '7988236912', 'Legacy corporate/B2B inquiry imported from mindcafe.app', 'new', '2024-09-20 12:41:52');
