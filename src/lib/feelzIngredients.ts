// Ingredient science content for /ingredients — sourced verbatim from the
// client-supplied "Feelz Ingredients page.pdf" content master and the
// "FEELZ — Research Reference Library.pdf" / research xlsx (PubMed IDs).
// This is deliberately data, not JSX: the ingredient drawer component reads
// straight from this file so the four products share one rendering path
// rather than four hand-built sections (see the CMS shape the brief itself
// recommends).
//
// Every `research` line is ingredient-level evidence, not a claim about the
// finished FEELZ product — each `formulationNote` exists specifically to
// keep that distinction visible next to the research, per the brief's
// compliance guidance. Do not strengthen these into direct product claims.

export type FeelzMoodKey = "focus" | "joy" | "extrovert" | "rest";

export type FeelzIngredient = {
  name: string;
  amount: string;
  standardization?: string;
  cardHeadline: string;
  cardHook: string;
  whatIsIt: string;
  whyInFeelz: string;
  research: string;
  formulationNote: string;
  researchUrl?: string;
  // Real ingredient photography, client-supplied (see public/feelz-creative/
  // ingredients/) — every ingredient used across all four moods has one.
  image?: string;
};

export const FEELZ_INGREDIENTS: Record<FeelzMoodKey, FeelzIngredient[]> = {
  focus: [
    {
      name: "Gotu Kola Extract",
      amount: "60 mg",
      standardization: "40% triterpenes",
      cardHeadline: "The traditional brain herb.",
      cardHook: "But what does it actually have to do with Focus?",
      whatIsIt:
        "Gotu Kola, or Centella asiatica, is a traditional herbal ingredient that has been studied for its relationship with alertness, mood and cognitive function. FEELZ Focus contains 60 mg of Gotu Kola Extract, standardized to 40% triterpenes.",
      whyInFeelz:
        "Think about sitting down to work and constantly losing your place. One notification becomes three. One thought becomes five. Your attention keeps leaving the room. Gotu Kola is included in Focus as part of a formulation built around cognitive clarity, focus and calm.",
      research:
        "A 2017 systematic review and meta-analysis of Centella asiatica found no significant overall improvement across cognitive domains compared with placebo. Some measures related to alertness and mood showed potential improvement, while the researchers noted differences in dose, preparation, standardization and product composition.",
      formulationNote:
        "The research helps explain why Gotu Kola is an interesting ingredient. It should not be interpreted as proof that the specific 60 mg FEELZ dose produces the same outcomes observed in individual studies.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/28878245/",
      image: "/feelz-creative/ingredients/gotu-kola.webp",
    },
    {
      name: "L-Theanine",
      amount: "50 mg",
      cardHeadline: "Found in your tea.",
      cardHook: "So why is it inside a Focus strip?",
      whatIsIt:
        "L-Theanine is an amino acid naturally found in tea leaves, particularly green tea. It has been studied in relation to relaxation, attention and mental performance.",
      whyInFeelz:
        "Focus isn't always about becoming more stimulated. Sometimes it's about reducing the noise around the thing you're trying to do. You're working on a presentation. Your phone buzzes. You check one message. Then another. L-Theanine is included in Focus because of its association with calm alertness and mental clarity.",
      research:
        "A 2026 systematic review and meta-analysis included 31 randomized controlled trials involving 1,168 participants. It found evidence of a short-term attention benefit at a 200 mg dose, while the authors noted that further research is needed for broader effects.",
      formulationNote:
        "The research uses different doses from FEELZ Focus. The evidence helps explain the ingredient's research profile; it should not be presented as proof that 50 mg in FEELZ Focus produces the same result.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/42410082/",
      image: "/feelz-creative/ingredients/l-theanine.webp",
    },
    {
      name: "Saffron Extract",
      amount: "30 mg",
      standardization: "3% crocin",
      cardHeadline: "More than a spice.",
      cardHook: "What does it have to do with Focus?",
      whatIsIt:
        "Saffron comes from the flowers of Crocus sativus — the plant commonly known for producing saffron spice. It contains naturally occurring compounds such as crocin, which have been studied in relation to mood, emotional wellbeing and cognitive function.",
      whyInFeelz:
        "Focus isn't only about attention. Sometimes you're trying to concentrate while your mental state isn't quite settled. Saffron is included as part of the formula's broader approach to focus, calm and emotional wellbeing.",
      research:
        "A 2026 systematic review and meta-analysis of 34 randomized controlled trials involving 1,769 adults found significant reductions in some self-reported depression and anxiety measures, while other clinician-rated measures did not show significant effects. The authors noted the need for further high-quality research.",
      formulationNote:
        "The studies use different saffron preparations, standardizations and doses. This evidence should therefore be treated as ingredient-level research, not proof of the exact effect of 30 mg of FEELZ Focus.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/41693488/",
      image: "/feelz-creative/ingredients/saffron.webp",
    },
    {
      name: "BioPerine®",
      amount: "5 mg",
      standardization: "95% piperine",
      cardHeadline: "Black pepper. Unexpectedly.",
      cardHook: "Why is it hiding inside a Focus formula?",
      whatIsIt:
        "BioPerine® is a standardized extract of black pepper (Piper nigrum). Its key active compound is piperine — the compound responsible for black pepper's characteristic pungency.",
      whyInFeelz:
        "Not every ingredient in a formulation needs to be the star. Piperine has been studied for its ability to influence the absorption and bioavailability of certain compounds, making BioPerine® a supporting player within the formulation. Piperine's effects can vary depending on the specific compound, dose and formulation — BioPerine® does not automatically mean more absorption of everything.",
      research:
        "Pharmacology reviews have examined piperine's effects on drug-metabolizing enzymes, intestinal absorption and pharmacokinetic interactions.",
      formulationNote:
        "BioPerine® is included as a supporting formulation ingredient. Because piperine can affect the absorption or metabolism of certain medicines, people taking medication should follow the product label and seek appropriate professional advice.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/21434835/",
      image: "/feelz-creative/ingredients/bioperine.webp",
    },
  ],
  joy: [
    {
      name: "L-Theanine",
      amount: "30 mg",
      cardHeadline: "Sometimes feeling better starts with feeling calmer.",
      cardHook: "But how does L-theanine give you Joy?",
      whatIsIt:
        "L-Theanine is an amino acid naturally found in tea leaves, particularly green tea. It has been studied in relation to relaxation, stress and mental performance.",
      whyInFeelz:
        "Some days you don't need more stimulation. You need to settle. Messages. Deadlines. Notifications. Small problems. A mind that refuses to slow down. L-Theanine is included in Joy for its association with relaxation and emotional balance.",
      research:
        "Human studies have explored L-Theanine in relation to relaxation, stress and cognitive outcomes. Recent evidence also reports a short-term attention benefit at higher studied doses.",
      formulationNote:
        "Some studies use doses substantially higher than the 30 mg in FEELZ Joy. Research therefore provides ingredient-level context rather than proof of the exact FEELZ dose.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/42410082/",
      image: "/feelz-creative/ingredients/l-theanine.webp",
    },
    {
      name: "Bacopa / Brahmi",
      amount: "25 mg",
      cardHeadline: "The Ayurvedic classic.",
      cardHook: "But why is it in a Joy formula?",
      whatIsIt:
        "Bacopa, also known as Brahmi, is a traditional Ayurvedic herb associated with memory, cognitive support and mental wellbeing.",
      whyInFeelz:
        "There are days when your mind feels overloaded. You're thinking about five things at once. Replaying conversations. Switching between tasks. Struggling to mentally switch off. Bacopa fits into Joy as part of its mental wellbeing and cognitive-support profile.",
      research:
        "Human research has mainly examined Bacopa in relation to cognitive performance and memory, with some evidence for memory recall and more limited evidence across other cognitive domains.",
      formulationNote:
        "Research has generally used substantially higher doses than the 25 mg in FEELZ Joy. The research should therefore not be presented as proof of the exact FEELZ dose.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/22747190/",
      image: "/feelz-creative/ingredients/brahmi.webp",
    },
    {
      name: "Ashwagandha",
      amount: "20 mg",
      cardHeadline: "Sounds familiar, right?",
      cardHook: "Not every bad day needs a big solution. Sometimes you just need to feel more balanced.",
      whatIsIt:
        "Ashwagandha is a traditional Ayurvedic botanical associated with stress adaptation, resilience and emotional stability.",
      whyInFeelz:
        "Imagine a day where one thing after another demands your attention. By evening, you're not necessarily unhappy — you're just mentally drained. Ashwagandha fits Joy because of its relationship with stress resilience and emotional stability.",
      research:
        "A 2024 systematic review and meta-analysis of 9 randomized controlled trials involving 558 participants reported improvements in measures of stress and anxiety.",
      formulationNote:
        "The studies used different extracts, doses and durations. They should not be presented as proof of the same effect from 20 mg in FEELZ Joy.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/39348746/",
      image: "/feelz-creative/ingredients/ashwagandha.webp",
    },
    {
      name: "Jatamansi",
      amount: "10 mg",
      cardHeadline: "The lesser-known botanical.",
      cardHook: "You've heard of Ashwagandha. But have you heard of Jatamansi?",
      whatIsIt:
        "Jatamansi, or Nardostachys jatamansi, is a traditional Ayurvedic herb associated with calmness and relaxation.",
      whyInFeelz:
        "You know that feeling when your body is tired but your mind is still going? Work is finished, but you're replaying conversations, thinking about tomorrow and carrying the day around with you. Jatamansi fits Joy as the ingredient associated with emotional calmness and relaxation.",
      research:
        "Human research on Jatamansi is more limited than for ingredients such as Ashwagandha or Bacopa. A clinical study examined Jatamansi in people with primary insomnia.",
      formulationNote:
        "That study used a different preparation and dose from the 10 mg in FEELZ Joy. It should be treated as ingredient-level research, not proof of the exact FEELZ formulation.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/26730138/",
      image: "/feelz-creative/ingredients/jatamansi.webp",
    },
  ],
  extrovert: [
    {
      name: "Ginger Extract",
      amount: "25 mg",
      cardHeadline: "Your chai knows it.",
      cardHook: "But why is it in a social-wellness formula?",
      whatIsIt: "Ginger is a familiar plant widely used in food and traditional wellness practices.",
      whyInFeelz:
        "Think about a day packed with meetings, conversations and social plans. By the final one, you may simply be running low. Ginger is included as part of Extrovert's broader wellness and energy-support profile, complementing the other ingredients in the formula.",
      research:
        "Human research on ginger has examined areas including nausea, digestion, inflammation and metabolic outcomes.",
      formulationNote:
        "The research involves different ginger preparations and doses. It should not be treated as proof of the exact effect of 25 mg Ginger Extract in FEELZ Extrovert.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/31935866/",
      image: "/feelz-creative/ingredients/ginger.webp",
    },
    {
      name: "Shatavari",
      amount: "25 mg",
      cardHeadline: "An Ayurvedic botanical you may not know yet.",
      cardHook: "So why is it in Extrovert?",
      whatIsIt:
        "Shatavari, or Asparagus racemosus, is a traditional Ayurvedic botanical associated with overall wellbeing and vitality.",
      whyInFeelz:
        "Meeting new people is easier when you feel like yourself. When you're already low on energy, even starting a simple conversation can feel like effort. Shatavari fits into Extrovert as part of its broader wellbeing and vitality profile.",
      research:
        "A 2025 randomized controlled study of Shatavari root extract in 80 women with perimenopausal symptoms reported improvements in several measures including stress, fatigue, vigor and quality of life after eight weeks.",
      formulationNote:
        "The population, preparation and dose differ from FEELZ. The research should be used to explain the ingredient, not as proof of the exact effect of 25 mg in FEELZ Extrovert.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/41209045/",
      image: "/feelz-creative/ingredients/shatavari.webp",
    },
    {
      name: "Ashwagandha",
      amount: "20 mg",
      cardHeadline: "Confidence isn't always about being the loudest person in the room.",
      cardHook: "Does it help feeling composed enough to be yourself?",
      whatIsIt:
        "Ashwagandha is a traditional Ayurvedic botanical studied in relation to stress management, resilience and emotional wellbeing.",
      whyInFeelz:
        "You're at a networking event. You want to introduce yourself. But your mind starts: what if they don't want to talk to me? What should I say? Am I making this awkward? Ashwagandha fits into Extrovert because of its connection with stress adaptation and resilience — relevant to moments when social situations feel overwhelming.",
      research: "Human clinical research has investigated Ashwagandha in relation to stress and anxiety.",
      formulationNote:
        "Research uses different extracts, doses and durations. It should not be presented as proof that 20 mg in FEELZ Extrovert produces the same outcomes.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/39348746/",
      image: "/feelz-creative/ingredients/ashwagandha.webp",
    },
    {
      name: "Vitamin B6",
      amount: "2 mg",
      cardHeadline: "Small dose. Important job.",
      cardHook: "What does Vitamin B6 have to do with your nervous system?",
      whatIsIt:
        "Vitamin B6 is an essential vitamin involved in more than 100 enzyme reactions in the body. It contributes to normal nervous-system and psychological function.",
      whyInFeelz:
        "Extrovert isn't about simply becoming \"more social.\" The formulation also considers the nutritional and physiological systems involved in everyday mental wellbeing — Vitamin B6 provides a nutritional role within the formula. It should not be described as an ingredient that directly makes someone confident, outgoing or extroverted; its role is nutritional.",
      research: "Vitamin B6 is an official NIH-recognized nutrient with a well-established nutritional role.",
      formulationNote:
        "A controlled human study has examined high-dose B6 and anxiety, but at doses well above FEELZ's 2 mg — that study should not be used to claim the same effect at this dose.",
      image: "/feelz-creative/ingredients/vitamin-b6.webp",
    },
    {
      name: "Saffron Extract",
      amount: "2 mg",
      cardHeadline: "The world's most precious spice.",
      cardHook: "And it has a very different story in wellness research.",
      whatIsIt:
        "Saffron comes from Crocus sativus and contains naturally occurring compounds that have been studied in relation to mood and emotional wellbeing.",
      whyInFeelz:
        "Imagine you're going to meet people but you're already feeling emotionally off. Sometimes the challenge isn't the room — it's how you feel walking into it. Saffron complements Extrovert's ingredients focused on emotional wellbeing, resilience and composure.",
      research:
        "A 2026 meta-analysis of 34 randomized controlled trials involving 1,769 adults found improvements in some self-reported depression and anxiety measures, but not across all clinician-rated measures.",
      formulationNote:
        "The research uses different saffron preparations and doses. It should be treated as ingredient-level evidence rather than proof of the exact effect of 2 mg in FEELZ Extrovert.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/41693488/",
      image: "/feelz-creative/ingredients/saffron.webp",
    },
  ],
  rest: [
    {
      name: "Melatonin",
      amount: "3 mg",
      cardHeadline: "Your body's night-time signal.",
      cardHook: "So why is it in FEELZ Rest?",
      whatIsIt:
        "Melatonin is a hormone naturally produced by the body that helps regulate the sleep-wake cycle. Melatonin levels normally rise in the evening as the body prepares for sleep.",
      whyInFeelz:
        "Rest is designed around the transition from awake, to winding down, to rest. Melatonin is the most directly sleep-related ingredient in the formula because of its role in the body's sleep-wake timing.",
      research:
        "A 2024 systematic review and dose-response meta-analysis included 26 randomized controlled trials. It found that melatonin reduced sleep-onset latency and increased total sleep time, with effects influenced by dose and timing.",
      formulationNote:
        "Research has used different doses and administration schedules. It should not be presented as proof that 3 mg in FEELZ Rest produces an identical outcome.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/38888087/",
      image: "/feelz-creative/ingredients/melatonin.webp",
    },
    {
      name: "L-Theanine",
      amount: "30 mg",
      cardHeadline: "Your body is tired.",
      cardHook: "So why is your brain still awake?",
      whatIsIt: "L-Theanine is an amino acid naturally found in tea leaves. It has been studied in relation to relaxation, stress and sleep-related outcomes.",
      whyInFeelz:
        "You finally put your phone down. You close your eyes. And your brain starts reviewing the entire day. L-Theanine fits into Rest because of its association with relaxation and mental calmness, complementing the sleep-related role of melatonin.",
      research:
        "Human studies have examined L-Theanine in relation to stress and sleep-related measures. Broader recent evidence has also investigated its effects on attention and affective outcomes.",
      formulationNote:
        "Some studies use substantially higher doses than the 30 mg in FEELZ Rest. The evidence provides ingredient-level context rather than proof of the exact FEELZ dose.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/42410082/",
      image: "/feelz-creative/ingredients/l-theanine.webp",
    },
    {
      name: "Brahmi",
      amount: "25 mg",
      cardHeadline: "Known for the mind.",
      cardHook: "But what does it have to do with Rest?",
      whatIsIt:
        "Brahmi, commonly referring to Bacopa monnieri, is a traditional Ayurvedic herb associated with mental and cognitive support.",
      whyInFeelz:
        "Imagine lying in bed after a long day. Your body is tired, but your mind is still processing everything that happened. Brahmi is positioned in Rest as part of the formula's relaxation-support architecture, alongside L-Theanine and Ashwagandha.",
      research:
        "Most human research on Bacopa has focused on cognition rather than sleep; a 2024 randomized controlled trial examining sleep quality did not find a significant overall improvement.",
      formulationNote: "Brahmi should not be presented as a proven sleep ingredient — its role in FEELZ Rest is part of the broader relaxation-support formulation.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/22747190/",
      image: "/feelz-creative/ingredients/brahmi.webp",
    },
    {
      name: "Ashwagandha",
      amount: "20 mg",
      cardHeadline: "The day is over.",
      cardHook: "But can your mind actually let go?",
      whatIsIt:
        "Ashwagandha is a traditional Ayurvedic botanical associated with stress adaptation, resilience and recovery.",
      whyInFeelz:
        "Sleep isn't only about being physically tired. Sometimes it's about whether your mind has actually finished the day — work is done, but the stress of the day is still sitting somewhere in the background. Ashwagandha is included in Rest as part of the formula's stress-management and recovery profile.",
      research:
        "A systematic review and meta-analysis of five randomized controlled trials involving 400 participants found a small overall improvement in sleep, with stronger effects reported in studies using 600 mg/day or more and treatment lasting at least eight weeks.",
      formulationNote:
        "Those research doses and durations are substantially different from 20 mg in FEELZ Rest. The evidence supports interest in the ingredient but does not establish the same effect at the FEELZ dose.",
      researchUrl: "https://pubmed.ncbi.nlm.nih.gov/34559859/",
      image: "/feelz-creative/ingredients/ashwagandha.webp",
    },
  ],
};

// "One ingredient, different roles" module — the same active ingredient
// plays a different formulation role depending on which product it's in.
export const FEELZ_CROSS_INGREDIENT: {
  name: string;
  roles: { mood: FeelzMoodKey; label: string; role: string }[];
}[] = [
  {
    name: "L-Theanine",
    roles: [
      { mood: "focus", label: "Focus", role: "Calm alertness & mental clarity" },
      { mood: "joy", label: "Joy", role: "Relaxation & emotional balance" },
      { mood: "rest", label: "Rest", role: "Relaxation & mental calmness" },
    ],
  },
  {
    name: "Ashwagandha",
    roles: [
      { mood: "joy", label: "Joy", role: "Stress resilience & emotional stability" },
      { mood: "extrovert", label: "Extrovert", role: "Stress management & resilience" },
      { mood: "rest", label: "Rest", role: "Stress management & recovery" },
    ],
  },
  {
    name: "Saffron",
    roles: [
      { mood: "focus", label: "Focus", role: "Mood & emotional wellbeing within a focus-oriented formula" },
      { mood: "extrovert", label: "Extrovert", role: "Mood & emotional wellbeing within a social-wellness formula" },
    ],
  },
];

export const FEELZ_RESEARCH_DISCLAIMER =
  "Scientific studies referenced on this page investigate individual ingredients, extracts or preparations that may differ in dose, standardization, formulation, duration and participant population from FEELZ products. The research is provided to explain the ingredient rationale and should not be interpreted as clinical proof of the effects of a specific FEELZ product or dose.";
