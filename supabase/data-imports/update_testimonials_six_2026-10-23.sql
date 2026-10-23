-- Updates the site testimonials to the six in the client's revised
-- "TESTIMONIALS Doc.pdf" (Hamza Khan, Amritanshi, Aatmik Parmar, Tushar,
-- Ashwin, Ankit).
--
-- Production currently holds exactly the 3 rows inserted by
-- replace_testimonials_2026-10-23.sql (checked 2026-10-23). This deletes
-- ONLY those 3 — matched by name — and inserts the 6. Anything else in
-- public.reviews (e.g. a review later published from /admin/feedback) is
-- left alone. Shows in the homepage, /feelz and /counselling carousels,
-- /reviews and the Feelz product pages.
--
-- Wording is the client's, with three obvious typos corrected: "It just
-- take seconds" -> "takes", "Rest a I was" -> "as", "Macloedganj" ->
-- "McLeodganj" (+ "the Triund Trek"). Opening/closing quote marks are
-- dropped — the site adds its own. All rated 5 (the PDF gives no stars).
-- Listed newest-first in the order of the PDF, so Hamza Khan stays the
-- featured tile. Expect the final select to return 6 rows.

begin;

delete from public.reviews where reviewer_name in ('Hamza Khan', 'Amritanshi', 'Aatmik Parmar');

insert into public.reviews (reviewer_name, city, rating, comment, is_corporate, created_at) values
  ('Hamza Khan', null, 5, 'I tried the Focus strips and honestly, I wasn’t expecting much from it. But I did feel more clear and alert after using it. It just takes seconds to take it. You just pop it in your mouth and it dissolves pretty quickly. I found it handy while working, especially when I needed to concentrate for a bit longer.', false, now() - interval '1 minutes'),
  ('Amritanshi', null, 5, 'I got the package. Thank you so much for sending this lovely package! ❤️ I’ve actually tried the Nutraceutical Strips, and honestly, mujhe pehle yakeen nahi tha ki itni small strip really kaam kar sakti hai. But after trying it, I was genuinely surprised—it actually works!

It’s so convenient, easy to use, and such a unique concept. And now I’ve also found a really cool and unique gift option for my friends! 😁 I’m definitely going to keep these in mind whenever I want to gift something different and useful.

So happy to see you coming up with something this innovative. Wishing you and the entire team lots of success! ❤️', false, now() - interval '2 minutes'),
  ('Aatmik Parmar', null, 5, 'I had a meeting and I was feeling really sleepy before it, so I tried Focus. Honestly, after like 20 minutes I felt much more awake and focused. I don’t know, I just felt more active and ready for the meeting.', false, now() - interval '3 minutes'),
  ('Tushar', null, 5, 'I tried the Focus strip while I was doing office work. I didn’t suddenly become a genius or anything. But I stayed on my laptop longer without getting distracted, which is rare for me. Also, no water needed, so that’s nice.', false, now() - interval '4 minutes'),
  ('Ashwin', null, 5, 'I found Feelz at the Zostel McLeodganj’s reception when I came back from the Triund Trek, and picked up Rest as I was really tired. I took a bath, and took a strip. It helped me relax, and I slept better than I thought I would.', false, now() - interval '5 minutes'),
  ('Ankit', null, 5, 'I was a bit worried JOY might taste weird, but it tasted like candy. It even melted very fast. I took two strips after getting home from a hectic day at work. My head usually feels all over the place after office, but I felt more relaxed and could switch off from work for a bit.', false, now() - interval '6 minutes');

commit;

select reviewer_name, rating, left(comment, 60) as comment from public.reviews order by created_at desc;

-- ROLLBACK to the previous 3: re-run the insert in
-- replace_testimonials_2026-10-23.sql after deleting these 6. The original
-- 13 July reviews are in that file's ROLLBACK block.
