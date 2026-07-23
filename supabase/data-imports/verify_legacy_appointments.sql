-- Run this first to check whether the earlier 39-statement batch actually
-- committed, or got rolled back together with the failing 40th statement
-- (which is what happens when a multi-statement script is sent to Postgres
-- as one request — the whole thing runs as one implicit transaction unless
-- explicitly split, and Supabase's SQL Editor sends pasted scripts as one
-- request).
select count(*) as legacy_appointments_found
from public.appointments a
join auth.users u on u.id = a.user_id
where lower(u.email) in (
  'alenphilip.ap@gmail.com','aliyahahmed830@gmail.com','aniruddhmishra2606@gmail.com',
  'ankit.sadani206@gmail.com','devanshj897@gmail.com','ekta@mymuse.in',
  'gauravjit.kaur@gmail.com','geet.garg@gmail.com','grisapujara1002@icloud.com',
  'happy.rkhl@gmail.com','iamkhushisharma@yahoo.com','jaidipchatterjee@gmail.com',
  'kamleshrabde2008@gmail.com','khushikitkat19@gmail.com','kumarkhushdeep23@gmail.com',
  'mansiimoar2002@gmail.com','mrinalbhatt624@gmail.com','palakbhate247@gmail.com',
  'prk1811225@gmail.com','raja@mymuse.in','saumya@mymuse.in',
  'saurabh1111thakur@gmail.com','shahv9341@gmail.com','singlavishal2004@gmail.com',
  'surbhigupta31071998@gmail.com','swathi@mymuse.in','ushmi_18@yahoo.com'
);
-- Expect 39 if the earlier batch committed successfully before row 40 failed.
-- Expect 0 if the whole script rolled back together (most likely, given how
-- the SQL Editor sends scripts).
