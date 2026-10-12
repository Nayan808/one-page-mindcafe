-- Real customer testimonials supplied by the client (TESTIMONIALS.pdf).
-- Every review/testimonial surface on the site reads public.reviews —
-- TestimonialsSection (home, /feelz, /counselling), the product pages'
-- reviews block, the /reviews page and the average/count summaries — so
-- inserting them here updates all of those at once.
--
-- created_at is staggered so they show in the client's order (Review 1
-- first; lists sort newest-first). The PDF gives no star ratings; 5 is
-- used for all three because each is unambiguously positive — change it
-- if the customers gave a different score. Idempotent: re-running skips
-- any review already present (matched on name + opening words).
--
-- Run in the Supabase SQL editor.

insert into public.reviews (reviewer_name, city, rating, comment, is_corporate, created_at)
select v.reviewer_name, null, 5, v.comment, false, v.created_at
from (
  values
    (
      'Hamza Khan',
      'I tried the Focus strips and honestly, I wasn’t expecting much from such a small strip. But I did feel more focused and alert after using it. It’s really easy to use too—you just pop it in your mouth and it dissolves pretty quickly, no water needed. I found it handy while working, especially when I needed to concentrate for a bit longer.',
      now()
    ),
    (
      'Amritanshi',
      'I got the package. Thank you so much for sending this lovely package! ❤️ I’ve actually tried the Nutraceutical Strips, and honestly, mujhe pehle yakeen nahi tha ki itni small strip really kaam kar sakti hai. But after trying it, I was genuinely surprised—it actually works! It’s so convenient, easy to use, and such a unique concept. And now I’ve also found a really cool and unique gift option for my friends! 😁 I’m definitely going to keep these in mind whenever I want to gift something different and useful. So happy to see you coming up with something this innovative. Wishing you and the entire team lots of success! ❤️',
      now() - interval '1 minute'
    ),
    (
      'Aatmik Parmar',
      'I had a meeting and I was feeling really sleepy before it, so I tried Focus. Honestly, after like 20 minutes I felt much more awake and focused. I don’t know, I just felt more active and ready for the meeting.',
      now() - interval '2 minutes'
    )
) as v(reviewer_name, comment, created_at)
where not exists (
  select 1
  from public.reviews r
  where r.reviewer_name = v.reviewer_name
    and left(r.comment, 40) = left(v.comment, 40)
);

-- OPTIONAL — only if these three should be the ONLY reviews shown (e.g.
-- the existing rows are placeholders). Review what's there first:
--   select reviewer_name, rating, left(comment, 60), created_at from public.reviews order by created_at desc;
-- then, if you're sure, uncomment:
-- delete from public.reviews
-- where reviewer_name not in ('Hamza Khan', 'Amritanshi', 'Aatmik Parmar');
