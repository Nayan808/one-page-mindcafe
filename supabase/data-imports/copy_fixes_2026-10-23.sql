-- Grammar / capitalisation fixes for copy stored in the database (the
-- /faq page and the About-page milestones). Update-only, nothing deleted;
-- each statement matches the current text exactly, so it changes nothing
-- if the row was already edited. Run in the Supabase SQL editor.

begin;

-- FAQs: product names were lowercase ("feelz", "focus", "joy"...).
update public.faqs set question = 'How do I take a Feelz strip?'
  where question = 'How do I take a feelz strip?';

update public.faqs set
  question = 'How quickly does Feelz work?',
  answer = 'Since the strip dissolves in your mouth, the ingredients are absorbed through the oral mucosa, which is faster than a traditional tablet. Effectiveness varies with individual factors like body weight; Feelz is a supportive wellness tool, not an instant fix.'
  where question = 'How quickly does feelz work?';

update public.faqs set
  answer = 'Focus sharpens mental clarity for work or study. Joy eases stress and low mood. Extrovert supports confidence before social situations. Rest helps you wind down before bed.'
  where question = 'When should I use each mood?'
    and answer like 'focus sharpens%';

update public.faqs set
  question = 'Will Feelz make me feel sleepy or drowsy?',
  answer = 'Only Rest is formulated to promote relaxation for bedtime. Focus, Joy and Extrovert support clarity and balance without drowsiness, so they''re fine for daytime use.'
  where question = 'Will feelz make me feel sleepy or drowsy?';

-- Milestones: brand names and the MIT-WPU spelling.
update public.milestones set description = 'Awarded ''Startup of the Year'' by MIT-WPU; grew to 10,000+ organic Instagram followers.'
  where description = 'Awarded ''Startup of the Year'' by MIT WPU; grew to 10,000+ organic Instagram followers.';

update public.milestones set description = 'Became the official brain-health partner of IKCA for the Asian Games 2026.'
  where description = 'Became Official Brain-health Partner of IKCA for the Asian Games 2026.';

update public.milestones set description = 'Launched Feelz wellness strips at Zostel locations across India.'
  where description = 'Launched feelz wellness strips at Zostel locations across India.';

commit;

select question from public.faqs order by question;
