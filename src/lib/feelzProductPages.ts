// Per-mood content for the /feelz/[mood] product detail pages — copy
// transcribed from the client-supplied product-page creatives (see
// public/feelz-creative/asset-p13..16, one full mockup per mood). Pricing
// is deliberately NOT in here: the only real, Supabase-backed price is the
// single "Sachet (10 pack)" variant each product currently has, fetched
// live in FeelzProductPageContent — the mockups also show "Pack of 2" and
// "Feelz Bundle" tiers, but those aren't real purchasable SKUs yet (no
// such product_variants rows exist), so this page doesn't render them.
import type { FeelzMoodKey } from "./feelzIngredients";

export type FeelzProductPageCopy = {
  flavor: string;
  // Real client-supplied product photography, in serial order (see
  // public/feelz-creative/products/{mood}/1.webp..7.webp) — same 7 photos
  // per mood, numbered by the client, rendered in that order rather than
  // re-sorted or curated.
  images: string[];
  positioning: string;
  // `image` reuses the matching real-life-moments photo that best depicts
  // this benefit (same file, same mood) — not a separate shoot, so it's
  // only ever the one that genuinely fits the label.
  benefits: { label: string; sub: string; image: string }[];
  painPointHeadline: string;
  painPointBody: string;
  comparisonTitle: string;
  comparisonAgainst: string;
  comparisonAgainstCons: string[];
  comparisonForPros: string[];
  // Real lifestyle photos, cropped from the per-mood reference collage
  // (public/feelz-creative/products/{mood}/5.png, see public/feelz-
  // creative/moments/) — not stock art.
  realLifeMoments: { label: string; note: string; image: string }[];
  closingHeadline: string;
  closingSub: string;
};

export const FEELZ_PRODUCT_PAGES: Record<FeelzMoodKey, FeelzProductPageCopy> = {
  focus: {
    flavor: "Mango",
    images: [1, 2, 3, 4, 5, 6, 7].map((n) => `/feelz-creative/products/focus/${n}.webp`),
    positioning: "For Cognitive Clarity, Focus & Calm",
    benefits: [
      { label: "Cognitive clarity", sub: "Think clearer", image: "/feelz-creative/moments/focus-creating-v3.webp" },
      { label: "Focused attention", sub: "Stay on track", image: "/feelz-creative/moments/focus-working-v3.webp" },
      { label: "Calm productivity", sub: "Get more done", image: "/feelz-creative/moments/focus-studying-v3.webp" },
    ],
    painPointHeadline: "Not tired. Just distracted.",
    painPointBody:
      "You sit down to finish an important task. Then your phone buzzes. You check one notification, reply to one message, and suddenly your attention is everywhere except the work in front of you.",
    comparisonTitle: "Sometimes, more energy isn't the answer.",
    comparisonAgainst: "Coffee / Energy Drink",
    comparisonAgainstCons: ["Energy + alertness", "Helps you feel awake", "Temporary boost", "Doesn't always solve distraction"],
    comparisonForPros: ["Cognitive clarity & focus", "Task engagement", "Sustained attention", "Calm productivity", "A more present state of mind"],
    realLifeMoments: [
      { label: "Studying", note: "Stay focused through long study sessions.", image: "/feelz-creative/moments/focus-studying-v3.webp" },
      { label: "Working", note: "Get more done with a clearer mind.", image: "/feelz-creative/moments/focus-working-v3.webp" },
      { label: "Creating", note: "Ideas flow better with a calmer, clearer mind.", image: "/feelz-creative/moments/focus-creating-v3.webp" },
      { label: "Travelling", note: "Stay on track, even on the go.", image: "/feelz-creative/moments/focus-travelling-v3.webp" },
      { label: "Everyday moments", note: "Be more present in what you do.", image: "/feelz-creative/moments/focus-everyday-v3.webp" },
    ],
    closingHeadline: "Got something to get done? Get in the zone.",
    closingSub: "Small strip. Big moments.",
  },
  joy: {
    flavor: "Spearmint",
    images: [1, 2, 3, 4, 5, 6, 7].map((n) => `/feelz-creative/products/joy/${n}.webp`),
    positioning: "For Mood Calm and Inner Happiness",
    benefits: [
      { label: "Positive mood", sub: "Feel lighter", image: "/feelz-creative/moments/joy-moodswings-v3.webp" },
      { label: "Calm mind", sub: "Stay balanced", image: "/feelz-creative/moments/joy-workstress-v3.webp" },
      { label: "Emotional wellbeing", sub: "More you, every day", image: "/feelz-creative/moments/joy-everyday-v3.webp" },
    ],
    painPointHeadline: "A calmer you. A happier day.",
    painPointBody:
      "Some days feel heavy. Your mind feels cloudy, motivation is low, and everything seems a little harder. FEELZ Joy is here to help you feel more balanced, positive and like yourself again.",
    comparisonTitle: "Not just a sweet treat.",
    comparisonAgainst: "Chocolate / Candy",
    comparisonAgainstCons: ["Quick mood lift", "Feels good momentarily", "Sugar crash later", "Doesn't support emotional balance"],
    comparisonForPros: ["Supports positive mood", "Helps you stay calm", "Supports emotional wellbeing", "A more balanced approach"],
    realLifeMoments: [
      { label: "Work stress", note: "Keeps me calmer during hectic days.", image: "/feelz-creative/moments/joy-workstress-v3.webp" },
      { label: "Mood swings", note: "Helps me feel more balanced.", image: "/feelz-creative/moments/joy-moodswings-v3.webp" },
      { label: "Social moments", note: "More confident and present.", image: "/feelz-creative/moments/joy-social-v3.webp" },
      { label: "Creative flow", note: "Helps me stay in a good headspace.", image: "/feelz-creative/moments/joy-creative-v3.webp" },
      { label: "Everyday moments", note: "A small strip for a brighter me.", image: "/feelz-creative/moments/joy-everyday-v3.webp" },
    ],
    closingHeadline: "More moments that feel like you. Get in the zone.",
    closingSub: "Small strip. Brighter moments.",
  },
  extrovert: {
    flavor: "Ginger",
    images: [1, 2, 3, 4, 5, 6, 7].map((n) => `/feelz-creative/products/extrovert/${n}.webp`),
    positioning: "For Confidence, Energy & Social Vitality",
    benefits: [
      { label: "Natural energy", sub: "Feel more active", image: "/feelz-creative/moments/extrovert-travelling-v3.webp" },
      { label: "Social confidence", sub: "Show up easily", image: "/feelz-creative/moments/extrovert-presenting-v3.webp" },
      { label: "Positive mood", sub: "Be your best self", image: "/feelz-creative/moments/extrovert-everyday-v3.webp" },
    ],
    painPointHeadline: "More you. In every moment.",
    painPointBody:
      "Whether it's a new room, a big meeting or a weekend plan, FEELZ Extrovert helps you feel more confident, energetic and present — so you can show up as your best self.",
    comparisonTitle: "Not just another energy boost.",
    comparisonAgainst: "Energy Drinks",
    comparisonAgainstCons: ["Quick spike", "Jitters", "Temporary boost", "Crash later"],
    comparisonForPros: ["Natural energy", "Social confidence", "Positive mood", "Supports your best self", "A more balanced approach"],
    realLifeMoments: [
      { label: "Socialising", note: "Helps you feel confident in new situations.", image: "/feelz-creative/moments/extrovert-socialising-v3.webp" },
      { label: "Presenting", note: "Stay calm and express yourself.", image: "/feelz-creative/moments/extrovert-presenting-v3.webp" },
      { label: "Travelling", note: "Feel more energetic and open to new people.", image: "/feelz-creative/moments/extrovert-travelling-v3.webp" },
      { label: "Hanging out", note: "Be present, engaged and your best self.", image: "/feelz-creative/moments/extrovert-hangingout-v3.webp" },
      { label: "Everyday moments", note: "A small strip for a more confident you.", image: "/feelz-creative/moments/extrovert-everyday-v3.webp" },
    ],
    closingHeadline: "More moments that feel like you. Get in the zone.",
    closingSub: "Small strip. Bigger moments.",
  },
  rest: {
    flavor: "Mixedberry + Mint",
    images: [1, 2, 3, 4, 5, 6, 7].map((n) => `/feelz-creative/products/rest/${n}.webp`),
    positioning: "For The Restful Sleep & a Relaxed Mind",
    benefits: [
      { label: "Relaxed mind", sub: "Wind down easily", image: "/feelz-creative/moments/rest-windingdown-v2.webp" },
      { label: "Better sleep", sub: "Fall asleep faster", image: "/feelz-creative/moments/rest-bettersleep-v2.webp" },
      { label: "Refreshed you", sub: "Wake up lighter", image: "/feelz-creative/moments/rest-everyday-v2.webp" },
    ],
    painPointHeadline: "Quiet mind. Better nights.",
    painPointBody:
      "Some days, your mind just doesn't switch off. Thoughts keep running, and sleep feels far away. FEELZ Rest helps you relax, unwind and slip into a more restful sleep — so you can wake up lighter.",
    comparisonTitle: "Not just counting sheep.",
    comparisonAgainst: "Late-night scrolling",
    comparisonAgainstCons: ["Keeps you alert", "Increases overthinking", "Disrupts sleep cycle", "Makes it harder to sleep"],
    comparisonForPros: ["Helps you relax", "Supports better sleep", "Calms an overactive mind", "Helps you unwind naturally", "A more balanced approach"],
    realLifeMoments: [
      { label: "Winding down", note: "Helps me relax after a busy day.", image: "/feelz-creative/moments/rest-windingdown-v2.webp" },
      { label: "Better sleep", note: "Helps me fall asleep faster.", image: "/feelz-creative/moments/rest-bettersleep-v2.webp" },
      { label: "A calmer mind", note: "Quietens my racing thoughts.", image: "/feelz-creative/moments/rest-calmermind-v2.webp" },
      { label: "Travelling", note: "Keeps me rested on the go.", image: "/feelz-creative/moments/rest-travelling-v2.webp" },
      { label: "Everyday moments", note: "Helps me wake up feeling lighter.", image: "/feelz-creative/moments/rest-everyday-v2.webp" },
    ],
    closingHeadline: "Got something better nights? Get in the zone.",
    closingSub: "Small strip. Calmer nights.",
  },
};
