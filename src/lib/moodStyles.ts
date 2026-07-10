// Visual identity per mood strip — mirrors the feelz brand site's four
// gradient moods. Keyed by lowercased product name so it stays correct
// however products are added/renamed in Supabase; unrecognized names fall
// back to the "focus" gradient rather than breaking the card layout.
export type MoodStyle = {
  gradient: string;
  badgeBg: string;
  tagline: string;
  useCases: string[];
};

export const MOOD_STYLES: Record<string, MoodStyle> = {
  focus: {
    gradient: "linear-gradient(160deg, #2461e0 0%, #14b3a0 100%)",
    badgeBg: "linear-gradient(135deg, #1fb894, #2461e0)",
    tagline: "deadline brain, on demand",
    useCases: ["for the 3pm wall", "for the spreadsheet you've been avoiding", "for the deep-work block you keep skipping"],
  },
  extrovert: {
    gradient: "linear-gradient(160deg, #f0405f 0%, #ff8a3d 100%)",
    badgeBg: "linear-gradient(135deg, #f0405f, #ff8a3d)",
    tagline: "small talk on tap",
    useCases: ["for the work happy hour", "for the friend-of-a-friend's birthday", "for when \"just be yourself\" is the problem"],
  },
  joy: {
    gradient: "linear-gradient(160deg, #ff9d2e 0%, #ffd23c 100%)",
    badgeBg: "linear-gradient(135deg, #ff9d2e, #ffd23c)",
    tagline: "sunday afternoon, weekday delivery",
    useCases: ["for the monday slump", "for grey-sky brain", "for when nothing's wrong but nothing's right"],
  },
  rest: {
    gradient: "linear-gradient(160deg, #5b3df0 0%, #8f6bff 100%)",
    badgeBg: "linear-gradient(135deg, #5b3df0, #8f6bff)",
    tagline: "lights out, no lecture",
    useCases: ["for racing-thought tuesdays", "for the 2am ceiling stare", "for the night before something big"],
  },
  sleep: {
    gradient: "linear-gradient(160deg, #5b3df0 0%, #8f6bff 100%)",
    badgeBg: "linear-gradient(135deg, #5b3df0, #8f6bff)",
    tagline: "lights out, no lecture",
    useCases: ["for racing-thought tuesdays", "for the 2am ceiling stare", "for the night before something big"],
  },
};

const FALLBACK: MoodStyle = MOOD_STYLES.focus;

export function moodStyleFor(productName: string): MoodStyle {
  return MOOD_STYLES[productName.trim().toLowerCase()] ?? FALLBACK;
}
