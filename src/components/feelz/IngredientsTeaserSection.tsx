"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { FEELZ_INGREDIENTS, type FeelzIngredient, type FeelzMoodKey } from "@/lib/feelzIngredients";
import { MOOD_STYLES, FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";

// Every ingredient across all four moods (17 entries, real data — not a
// separate copy of it), not just a 3-card sample: shown as a continuously
// running left-to-right marquee so someone doesn't have to leave /feelz to
// see more than three. Clicking a card still leads to the product page
// rather than duplicating the drawer experience here.
//
// Interleaved round-robin across moods (focus, joy, extrovert, rest, then
// repeat) rather than one mood's whole block before the next — each card's
// background is now tinted by its mood, so a plain per-mood grouping would
// show the same color several cards in a row; cycling through all four
// keeps the colors changing one at a time as they pass.
const MOOD_ORDER = ["focus", "joy", "extrovert", "rest"] as const;
const ALL_INGREDIENTS: { mood: FeelzMoodKey; ingredient: FeelzIngredient }[] = (() => {
  const maxLength = Math.max(...MOOD_ORDER.map((mood) => FEELZ_INGREDIENTS[mood].length));
  const interleaved: { mood: FeelzMoodKey; ingredient: FeelzIngredient }[] = [];
  for (let i = 0; i < maxLength; i++) {
    for (const mood of MOOD_ORDER) {
      const ingredient = FEELZ_INGREDIENTS[mood][i];
      if (ingredient) interleaved.push({ mood, ingredient });
    }
  }
  return interleaved;
})();

// ~3s per card keeps it readable without feeling sluggish.
const MARQUEE_SECONDS = ALL_INGREDIENTS.length * 3;

function IngredientCard({ mood, ingredient, hidden }: { mood: FeelzMoodKey; ingredient: FeelzIngredient; hidden: boolean }) {
  const colors = FEELZ_COLOR_CLASSES[MOOD_STYLES[mood].feelzColor];
  return (
    <div className={`group flex w-56 flex-col border ${colors.borderSoft} ${colors.bgSoft} p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}>
      {ingredient.image && (
        // The ingredient shots have a baked-in white background
        // (no alpha), so multiply-blend them: white drops out to
        // the card's own mood tint instead of showing as a white
        // disc. The subject only fills ~60% of each square shot,
        // so it's scaled up 1.5× — the overflowing margin is
        // white and blends away too.
        <div className="relative mb-4 h-40 w-full shrink-0">
          <Image
            src={ingredient.image}
            alt={hidden ? "" : ingredient.name}
            fill
            sizes="240px"
            className="scale-150 object-contain mix-blend-multiply transition-transform duration-500 group-hover:scale-[1.6]"
          />
        </div>
      )}
      <span className={`w-fit rounded-full ${colors.bgTint} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-label ${colors.text}`}>
        {mood}
      </span>
      <p className="font-display mt-3 text-lg font-bold text-feelz-ink">{ingredient.name}</p>
      <p className="mt-1 text-xs text-feelz-ink/60">{ingredient.amount}</p>
      <p className="mt-2 text-sm leading-relaxed text-feelz-ink/60">{ingredient.cardHeadline}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-feelz-ink/50">{ingredient.cardHook}</p>
      <Link
        href={`/feelz/${mood}`}
        tabIndex={hidden ? -1 : undefined}
        className={`mt-3 flex items-center justify-center gap-1 self-center rounded-full ${colors.bg} px-3 py-1.5 text-[11px] font-semibold uppercase tracking-label text-feelz-cream transition hover:opacity-90`}
      >
        View Product
      </Link>
    </div>
  );
}

export function IngredientsTeaserSection() {
  return (
    <section className="border-y border-feelz-ink/10 bg-feelz-paper py-16">
      <div className="mx-auto max-w-[88rem] px-4 sm:px-6">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-berry">Natural Ingredients</p>
          <h2 className="font-display mt-2 text-3xl font-bold text-feelz-ink sm:text-4xl">
            Know Your <span className="font-tagline italic">Ingredients</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-feelz-ink/60">
            Ancient wisdom. Modern formulation. For a calmer, brighter you.
          </p>
        </div>
      </div>

      {/* Same marquee keyframes as CredibilityStrip/ZostelLocationsSection,
          run in reverse so cards travel left → right. The list is rendered
          twice and the track slides by exactly one copy's width (-50%), so
          the loop is seamless — hence per-card right padding instead of
          `gap`, which would leave the halfway point off by half a gap.
          Hover pauses it so a card can be read/clicked; reduced-motion
          drops the animation (globals.css) and falls back to a swipeable
          row. Edges fade out via a mask rather than cutting hard. */}
      <Reveal className="mt-10">
        <div className="scrollbar-hide overflow-hidden py-2 [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] motion-reduce:overflow-x-auto">
          <div
            className="marquee-track flex w-max items-start hover:[animation-play-state:paused]"
            style={{ animation: `marquee ${MARQUEE_SECONDS}s linear infinite reverse` }}
          >
            {[0, 1].map((copy) =>
              ALL_INGREDIENTS.map(({ mood, ingredient }) => (
                <div
                  key={`${copy}-${mood}-${ingredient.name}`}
                  className="shrink-0 pr-5"
                  aria-hidden={copy === 1 ? true : undefined}
                >
                  <IngredientCard mood={mood} ingredient={ingredient} hidden={copy === 1} />
                </div>
              )),
            )}
          </div>
        </div>
      </Reveal>

      <div className="mt-8 text-center">
        <Link
          href="/ingredients"
          className="inline-flex items-center gap-1.5 rounded-full bg-feelz-ink px-5 py-2.5 text-sm font-medium text-feelz-cream transition hover:opacity-90"
        >
          See all ingredients
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </div>
    </section>
  );
}
