// Visual identity per mood strip — mirrors the feelz brand site's four
// gradient moods. Keyed by lowercased product name so it stays correct
// however products are added/renamed in Supabase; unrecognized names fall
// back to the "focus" gradient rather than breaking the card layout.
export type MoodStyle = {
  gradient: string;
  badgeBg: string;
  tagline: string;
  useCases: string[];
  /** Short "what it does" line — sourced from mindcafe.app/feelz. */
  description: string;
  /** Key active ingredients per strip, sourced from mindcafe.app/feelz. */
  ingredients: string[];
  /** This mood's accent color from the real packaging/creative photography
   * (see public/feelz-creative) — a Tailwind `feelz-*` token name, used on
   * the Feelz-branded surfaces (hero carousel, product selector, /ingredients)
   * rather than the sitewide mauve/navy brand colors. */
  feelzColor: "feelz-navy" | "feelz-berry" | "feelz-orange" | "feelz-rest";
  /** Full-bleed hero creative banner for this mood — logo, headline, bullet
   * icons and CTA are baked into the image itself (see Hero carousel). */
  heroSrc: string;
  /** One-line state expression from the brand guide (e.g. "Get in the zone"),
   * used on the /ingredients product selector and the Feelz hero carousel. */
  stateLine: string;
};

export const MOOD_STYLES: Record<string, MoodStyle> = {
  focus: {
    gradient: "linear-gradient(160deg, #2461e0 0%, #14b3a0 100%)",
    badgeBg: "linear-gradient(135deg, #1fb894, #2461e0)",
    tagline: "Get into the zone.",
    useCases: ["for the 3pm wall", "for the spreadsheet you've been avoiding", "for the deep-work block you keep skipping"],
    description: "Work, study and demanding days when sustained attention matters.",
    ingredients: ["Gotu Kola", "L-theanine", "Saffron", "Bioperine"],
    feelzColor: "feelz-navy",
    heroSrc: "/feelz-creative/01-feelz-focus-v2.webp",
    stateLine: "Get in the zone.",
  },
  extrovert: {
    gradient: "linear-gradient(160deg, #f0405f 0%, #ff8a3d 100%)",
    badgeBg: "linear-gradient(135deg, #f0405f, #ff8a3d)",
    tagline: "Feel more socially switched on.",
    useCases: ["for the work happy hour", "for the friend-of-a-friend's birthday", "for when \"just be yourself\" is the problem"],
    description: "Conversations, gatherings and moments when you want to feel more at ease.",
    ingredients: ["Ginger", "Shatavari", "Ashwagandha", "Vitamin B6"],
    feelzColor: "feelz-orange",
    heroSrc: "/feelz-creative/03-feelz-extrovert-v2.webp",
    stateLine: "Show up as you.",
  },
  joy: {
    gradient: "linear-gradient(160deg, #ff9d2e 0%, #ffd23c 100%)",
    badgeBg: "linear-gradient(135deg, #ff9d2e, #ffd23c)",
    tagline: "Lift the everyday.",
    useCases: ["for the monday slump", "for grey-sky brain", "for when nothing's wrong but nothing's right"],
    description: "Low-energy afternoons, social plans and moments that need a little more spark.",
    ingredients: ["L-theanine", "Brahmi", "Ashwagandha", "Jatamansi"],
    feelzColor: "feelz-berry",
    heroSrc: "/feelz-creative/02-feelz-joy-v2.webp",
    stateLine: "Come back to yourself.",
  },
  rest: {
    gradient: "linear-gradient(160deg, #5b3df0 0%, #8f6bff 100%)",
    badgeBg: "linear-gradient(135deg, #5b3df0, #8f6bff)",
    tagline: "Wind down better.",
    useCases: ["for racing-thought tuesdays", "for the 2am ceiling stare", "for the night before something big"],
    description: "Evenings when your mind needs help shifting into rest mode.",
    ingredients: ["Melatonin", "L-theanine", "Brahmi", "Ashwagandha"],
    feelzColor: "feelz-rest",
    heroSrc: "/feelz-creative/04-feelz-rest-v2.webp",
    stateLine: "Switch off, ease in.",
  },
  sleep: {
    gradient: "linear-gradient(160deg, #5b3df0 0%, #8f6bff 100%)",
    badgeBg: "linear-gradient(135deg, #5b3df0, #8f6bff)",
    tagline: "lights out, no lecture",
    useCases: ["for racing-thought tuesdays", "for the 2am ceiling stare", "for the night before something big"],
    description: "Formulated to address racing thoughts and sleep difficulty, for nighttime wind-down.",
    ingredients: ["l-theanine 25mg", "brahmi 20mg", "ashwagandha 20mg", "melatonin 3mg"],
    feelzColor: "feelz-rest",
    heroSrc: "/feelz-creative/04-feelz-rest-v2.webp",
    stateLine: "Switch off, ease in.",
  },
};

// Tailwind's scanner only picks up class names it can find as literal
// strings in source — `bg-${style.feelzColor}` would silently produce no
// CSS at all in production. This map exists so every feelz-color usage
// resolves through a fully-static string instead.
export const FEELZ_COLOR_CLASSES: Record<MoodStyle["feelzColor"], { bg: string; bgTint: string; text: string; border: string }> = {
  "feelz-navy": { bg: "bg-feelz-navy", bgTint: "bg-feelz-navy/10", text: "text-feelz-navy", border: "border-feelz-navy" },
  "feelz-berry": { bg: "bg-feelz-berry", bgTint: "bg-feelz-berry/10", text: "text-feelz-berry", border: "border-feelz-berry" },
  "feelz-orange": { bg: "bg-feelz-orange", bgTint: "bg-feelz-orange/10", text: "text-feelz-orange", border: "border-feelz-orange" },
  "feelz-rest": { bg: "bg-feelz-rest", bgTint: "bg-feelz-rest/10", text: "text-feelz-rest", border: "border-feelz-rest" },
};

const FALLBACK: MoodStyle = MOOD_STYLES.focus;

export function moodStyleFor(productName: string): MoodStyle {
  return MOOD_STYLES[productName.trim().toLowerCase()] ?? FALLBACK;
}

// The four shoppable moods, in display order — single source of truth for
// every place that lists them: the Feelz product grid (Hero.tsx), the
// footer's Feelz links, and the header's Shop mega-menu. Previously
// hand-copied in three places, which is exactly how they'd drift out of
// sync if a mood were ever added/renamed.
export const MOOD_GRID: { key: string; label: string; src: string }[] = [
  { key: "extrovert", label: "Extrovert", src: "/products/extrovert.png" },
  { key: "focus", label: "Focus", src: "/products/focus.png" },
  { key: "joy", label: "Joy", src: "/products/joy.png" },
  { key: "rest", label: "Rest", src: "/products/rest.png" },
];
