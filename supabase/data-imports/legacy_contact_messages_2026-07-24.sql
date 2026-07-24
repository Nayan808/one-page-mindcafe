-- Legacy "contact us" form submissions from mindcafe.app's `contact_us`
-- table (23 raw rows), imported into the new public.contact_messages table
-- (separate from business_leads -- this data is a mix of job applicants,
-- general questions, and complaints, not B2B leads with a company name).
--
-- Excluded:
--  - contact_id 39: exact duplicate of 38 (same person/message, 15 seconds
--    apart) -- kept only the first.
--  - contact_id 41: SEO backlink spam ("SeoBests.com"), not a real message.
--  - contact_id 55, 56: "testing..." submissions from the same person
--    (Khushi Viradiya) -- QA/test data, not real contacts.
--
-- FLAGGED, imported as-is but needs your own direct attention (not
-- something I acted on): contact_id 36 is a serious complaint alleging a
-- named psychologist ("Dr Meghna Singhal") engaged in public humiliation
-- of a patient and possible abetment to suicide. contact_id 43 is a
-- customer complaint about a paid session with no confirmation email --
-- worth checking whether that customer (Harsh Gangrade,
-- gangradeharsh5@gmail.com) was ever actually followed up with.

-- legacy contact_id 34
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('parul', 'maggo.parul@fincart.com', '9485934275', 'enquiry regarding corporate wellness program', 'new', '2025-07-11 07:37:44');

-- legacy contact_id 35
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Rishab Gupta', 'rishabgupta179@gmail.com', '7225807459', 'Seeking Research Internships/Job Opportunties.', 'new', '2025-07-21 02:41:28');

-- legacy contact_id 36
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('nibu manavalan', 'nibu86@gmail.com', '8198078987', 'one of you psychologists dr meghna singhal has engaged in public humiliation of a mental patient on linkedin and possible abetment to suicide.do not employ psychotic psychologists like herself', 'new', '2025-07-24 09:18:37');

-- legacy contact_id 37
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Arkita singh', 'arkita.singh01@gmail.com', '7869257003', 'Hello,
I hold a Master''s degree in Forensic Psychology and was hoping if Mindcafe has any openings for Counselling Psychologist or Psychologist position, please do reach out.

Regards,
Arkita singh', 'new', '2025-08-21 13:30:40');

-- legacy contact_id 38
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Anushka Lenjhara', 'lenjharaanushka@gmail.con', '9827722113', 'Hi. I''m a student currently pursuing final year in post graduation in psychology. Would love to look at opportunities to connect with you.', 'new', '2025-09-13 05:57:55');

-- legacy contact_id 40
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Divyansh Choubey', 'choubey.divyanshofficial@gmail.com', '9302340537', 'Good evening, I am divyansh,and I am looking for an internship in The Mind Cafe, looking forward to a positive response from your side.', 'new', '2025-09-25 12:43:07');

-- legacy contact_id 42
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Harshita Tomar', 'harshitatomar783@gmail.com', '6263056858', 'Ask for collaboration', 'new', '2025-11-18 06:48:31');

-- legacy contact_id 43
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Harsh Gangrade', 'gangradeharsh5@gmail.com', '7024969408', 'I had booked for a session on 29 dec and also paid the money for it and got a mail for it but no appointment mail or confirmation mail or its not showing in the appointments too so please find a solution for it', 'new', '2025-12-29 02:22:06');

-- legacy contact_id 44
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Zubia kouser', 'zubiakouser786@gmail.com', '6005284908', 'Hello Sir/Madam,
I am interested in joining your team. I am currently working as a Counselor in the Defense Force and would love to contribute my skills and experience to your organization.
Looking forward to your response.
Thank you.', 'new', '2026-01-19 13:55:38');

-- legacy contact_id 45
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Rupal Pai Rathi', 'pairupal@gmail.com', '9819000095', 'Him, I would like to apply for a Position of Counseling Psychologist with Mindcafe. Kindly let me know how to proceed further.', 'new', '2026-01-20 04:39:34');

-- legacy contact_id 46
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('manav', 'manav.shah@Bizdateup.com', '8104878748', 'I am reaching out on behalf of BizDateUp. Mindcafe remarkable growth and innovation have caught our attention.

We focus on strategic investments (₹10-20 crore) and provide the support and network needed to accelerate growth. I''d love to connect and explore potential opportunities to collaborate.

Best regards,

Manav shah', 'new', '2026-01-30 05:24:50');

-- legacy contact_id 47
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Harshita Gurbani', 'harshitagurbani2002@gmail.com', '8964879770', 'I''m writing to express my interest in working with Mindcafe Bhopal in roles aligned with mental health service delivery, assessment, counseling/psychotherapy, or program support. I hold a Master''s degree in Clinical Psychology and have supervised clinical experience across hospital and community settings, including psychological assessments, report writing, and therapeutic interventions with diverse client groups.', 'new', '2026-02-03 09:16:45');

-- legacy contact_id 48
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Jagdeep Kaur', 'Jagdeepk2006.com@gmail.com', '9770701605', 'I am a BSc Psychology student and I would like to inquire about possible internship opportunities at your institution during the coming summer. I am eager to gain practical experience and would appreciate any information on available positions.', 'new', '2026-02-06 09:44:36');

-- legacy contact_id 49
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Divya Lalchandani', 'divyalalchandani.26@gmail.com', '9981990726', 'I wanted to know about internship opportunities. Could you send a mail regarding it?', 'new', '2026-02-07 05:03:22');

-- legacy contact_id 50
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Meenakshi Ghosh', 'meenakshighosh8@gmail.com', '7005086804', 'Hello,

I have come across a job vacancy regarding sports Psychologist in uttarakhand, is the vacancy still available?', 'new', '2026-04-18 15:44:28');

-- legacy contact_id 51
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Shivam Talreja', 'shivamtalreja@gmail.com', '9920360341', 'I am looking to apply to the team as a Sport and Performance Psychologist. Kindly let me know what the steps to do the same are.', 'new', '2026-04-20 12:19:27');

-- legacy contact_id 52
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Suzaina Khan', 'suzaina.khan@ibeforum.com', '9108120318', 'Business Partnership', 'new', '2026-05-04 08:29:54');

-- legacy contact_id 53
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Kritika Luthra', 'kritikaluthra11@gmail.com', '8587010561', 'We are looking to implement an EAP. Request you to share details on the program you offer with quotations. Kindly share details on a call.', 'new', '2026-05-12 04:21:23');

-- legacy contact_id 54
insert into public.contact_messages (name, email, phone, message, status, created_at)
values ('Kritika Luthra', 'kritika.luthra@ralson.com', '8587010561', 'We are planning to implement an EAP. Requesting your callback to understand the details of program', 'new', '2026-05-15 04:27:08');
