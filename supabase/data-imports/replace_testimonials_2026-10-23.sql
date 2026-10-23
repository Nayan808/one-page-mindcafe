-- Replaces every testimonial on the site with the three from the client's
-- TESTIMONIALS.pdf (Hamza Khan, Amritanshi, Aatmik Parmar).
--
-- DESTRUCTIVE: deletes all 13 current rows in public.reviews (the
-- July sample testimonials — Priya K., Sneha R., Vikram R., ...). Free plan,
-- no backups: the full original rows are saved in the ROLLBACK block at the
-- bottom of this file — keep this file until you're happy with the result.
--
-- Affects every place that reads public.reviews: the homepage, /feelz and
-- /counselling testimonial carousels, the /reviews page, the review block on
-- each Feelz product page, and the star average shown next to them. Nothing
-- else references this table (no foreign keys point at it, no triggers).
--
-- The PDF has no star ratings and the column requires one (1-5): all three
-- are set to 5 — change below before running if that's not right. City is
-- left empty (not in the PDF). Run in the Supabase SQL editor; expect the
-- final select to return exactly 3 rows.

begin;

delete from public.reviews;

insert into public.reviews (reviewer_name, city, rating, comment, is_corporate, created_at) values
  ('Hamza Khan', null, 5, 'I tried the Focus strips and honestly, I wasn’t expecting much from such a small strip. But I did feel more focused and alert after using it. It’s really easy to use too—you just pop it in your mouth and it dissolves pretty quickly, no water needed. I found it handy while working, especially when I needed to concentrate for a bit longer.', false, now() - interval '1 minutes'),
  ('Amritanshi', null, 5, 'I got the package. Thank you so much for sending this lovely package! ❤️ I’ve actually tried the Nutraceutical Strips, and honestly, mujhe pehle yakeen nahi tha ki itni small strip really kaam kar sakti hai. But after trying it, I was genuinely surprised—it actually works!

It’s so convenient, easy to use, and such a unique concept. And now I’ve also found a really cool and unique gift option for my friends! 😁 I’m definitely going to keep these in mind whenever I want to gift something different and useful.

So happy to see you coming up with something this innovative. Wishing you and the entire team lots of success! ❤️', false, now() - interval '2 minutes'),
  ('Aatmik Parmar', null, 5, 'I had a meeting and I was feeling really sleepy before it, so I tried Focus. Honestly, after like 20 minutes I felt much more awake and focused. I don’t know, I just felt more active and ready for the meeting.', false, now() - interval '3 minutes');

commit;

select reviewer_name, rating, left(comment, 60) as comment, created_at from public.reviews order by created_at desc;

-- ROLLBACK — restores the 13 original rows exactly (same ids and dates):
--
-- begin;
-- delete from public.reviews;
-- insert into public.reviews (id, reviewer_id, reviewer_name, city, rating, comment, related_expert_id, is_corporate, created_at) values
--   ('9bf458bb-7286-44c4-8b4a-27a74ef564dc', null, 'Priya K.', 'Pune', 5, '75% improvement they claim — I thought it was marketing. Six sessions later I''m one of those 75%. Thank you Mindcafe.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('db51c73f-db6d-48ea-a683-77f84581caff', null, 'Sneha R.', 'Kolkata', 5, 'The relationship counselling helped my husband and I communicate again after two years of arguments. We both felt heard for the first time.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('6bf3d4ac-3dd9-4283-af56-c925784f1653', null, 'Priya P.', 'Jaipur', 5, 'Discovered Feelz at a Zostel in Rishikesh. Now I travel with a tin of Focus and one of Calm. Makes solo travel so much more enjoyable.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('474c9648-cfdb-4cbd-9518-d6a547ce463a', null, 'Vikram R.', 'Gurgaon', 5, 'Burnout had me completely paralysed. Three months with Mindcafe and I can actually look at my laptop again. Cannot put a price on that.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('251ad9ca-5ff9-44bd-9715-4bd637de5939', null, 'Tanvi M.', 'Chennai', 4, 'Sleep variant worked from the first night. I was nervous about melatonin but the dose is very gentle. No groggy feeling the next morning.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('1063d3ec-c436-4ee9-a9de-3ba8ebfcde7f', null, 'Nisha D.', 'Hyderabad', 5, 'I was sceptical about online therapy. But the session felt just as personal as being in a room. My counsellor remembered every detail. Truly impressive.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('a636d54b-09d2-41c9-ba4b-f04a5610a20e', null, 'Karan S.', 'Mumbai', 5, 'Calm strips have become my go-to before client calls. I used to get anxious talking to new people. It takes the edge off without making me drowsy.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('a7c3b020-d658-4452-a719-46531ed41b57', null, 'Parul M.', 'Bhopal', 5, 'One of the best platforms to understand your wellbeing from the inside out. The therapist was warm, professional, and actually effective.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('d10dc7e6-930c-48bd-b995-7e1d8677673d', null, 'Bhavya G.', 'Bangalore', 4, 'The self-love course changed my perspective completely. Small steps, real results. I felt supported throughout without any pressure.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('3c7fabe8-fbac-4ce7-9118-864f8ef16578', null, 'Riya V.', 'Pune', 5, 'Tried the Focus strips before a big presentation. Felt genuinely sharper. No jitters like coffee gives me. Already ordered the tin.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('ce0946c2-57a1-481b-8fe1-8106d548af3b', null, 'Ajay S.', 'Delhi', 5, 'I gifted my son a session as a last resort. It bridged a gap between us that I never knew how to close. He''s a different person today.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('e1b3f844-5f8a-480d-a475-4681ae07c900', null, 'Ananya K.', 'Bangalore', 5, 'The counsellor truly listened. After just four sessions I felt like I had tools I never had before. Highly recommend to anyone struggling silently.', null, false, '2026-07-17T06:56:11.976525+00:00'),
--   ('feaab38c-ae65-4ff7-98ca-e80e5ac35bbe', null, 'Shifa S.', 'Mumbai', 5, 'I was losing control of my life and didn''t know where to turn. Mindcafe gave me real tools — not just advice. The counsellor I worked with understood me without judgment. I''m genuinely grateful for what this platform has done for me.', null, false, '2026-07-17T06:56:11.976525+00:00');
-- commit;
