"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { FEELZ_INGREDIENTS, type FeelzIngredient, type FeelzMoodKey } from "@/lib/feelzIngredients";
import { MOOD_STYLES, FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";

// Every ingredient across all four moods (17 entries, real data — not a
// separate copy of it), not just a 3-card sample: browsable here via
// scroll/swipe/arrows so someone doesn't have to leave /feelz to see more
// than three. Clicking a card still leads to the full /ingredients page
// rather than duplicating the drawer experience here.
//
// Interleaved round-robin across moods (focus, joy, extrovert, rest, then
// repeat) rather than one mood's whole block before the next — each card's
// background is now tinted by its mood, so a plain per-mood grouping would
// show the same color several cards in a row; cycling through all four
// keeps the colors changing one at a time as you scroll.
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

export function IngredientsTeaserSection() {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function scroll(direction: "left" | "right") {
    scrollRef.current?.scrollBy({ left: direction === "left" ? -300 : 300, behavior: "smooth" });
  }

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

        <div className="relative mt-10 flex items-center gap-2">
          <button
            type="button"
            onClick={() => scroll("left")}
            aria-label="Scroll ingredients left"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-feelz-ink/15 bg-feelz-cream text-feelz-ink shadow-sm transition hover:bg-feelz-ink/5 sm:flex"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>

          <div ref={scrollRef} className="scrollbar-hide flex min-w-0 gap-5 overflow-x-auto scroll-smooth pb-2">
            {ALL_INGREDIENTS.map(({ mood, ingredient }, index) => {
              const colors = FEELZ_COLOR_CLASSES[MOOD_STYLES[mood].feelzColor];
              return (
                <Reveal key={`${mood}-${ingredient.name}`} delayMs={Math.min(index, 5) * 60} className="shrink-0">
                  <Link
                    href={`/ingredients#${mood}`}
                    className={`group flex h-full w-64 flex-col rounded-2xl border ${colors.borderSoft} ${colors.bgSoft} p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
                  >
                    {ingredient.image && (
                      <div className="relative mb-4 h-24 w-full overflow-hidden rounded-xl bg-white">
                        <Image
                          src={ingredient.image}
                          alt={ingredient.name}
                          fill
                          sizes="256px"
                          className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <span className={`w-fit rounded-full ${colors.bgTint} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-label ${colors.text}`}>
                      {mood}
                    </span>
                    <p className="font-display mt-4 text-xl font-bold text-feelz-ink">{ingredient.name}</p>
                    <p className="mt-1 text-sm text-feelz-ink/60">{ingredient.amount}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-feelz-ink/60">{ingredient.cardHeadline}</p>
                    <span className={`mt-4 flex items-center gap-1 text-xs font-semibold uppercase tracking-label ${colors.text}`}>
                      Learn more
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scroll("right")}
            aria-label="Scroll ingredients right"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-feelz-ink/15 bg-feelz-cream text-feelz-ink shadow-sm transition hover:bg-feelz-ink/5 sm:flex"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/ingredients"
            className="inline-flex items-center gap-1.5 rounded-full bg-feelz-ink px-5 py-2.5 text-sm font-medium text-feelz-cream transition hover:opacity-90"
          >
            See all ingredients
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
