"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Modal } from "@/components/Modal";
import { MOOD_GRID, MOOD_STYLES, FEELZ_COLOR_CLASSES } from "@/lib/moodStyles";
import { FEELZ_INGREDIENTS, FEELZ_CROSS_INGREDIENT, FEELZ_RESEARCH_DISCLAIMER, type FeelzMoodKey } from "@/lib/feelzIngredients";

// /ingredients — a standalone content page, not part of the checkout/cart
// flow, so it's deliberately simple client state (selected mood + open
// drawer) rather than URL-synced, except for the initial mood, which reads
// a #focus/#joy/#extrovert/#rest hash on load so links from the product
// modal ("Know your ingredients →" in Hero.tsx) land on the right tab. The
// four-level copy hierarchy the brief specifies (name/amount/headline/hook
// visible immediately → what-is-it/why-in-feelz on click → research →
// formulation note) is what keeps this from reading like a nutrition-facts
// page: each ingredient earns its research citation by being interesting
// first.
const MOOD_LABELS: Record<FeelzMoodKey, string> = { focus: "Focus", joy: "Joy", extrovert: "Extrovert", rest: "Rest" };
const VALID_MOODS: FeelzMoodKey[] = ["focus", "joy", "extrovert", "rest"];

export default function IngredientsPage() {
  const [activeMood, setActiveMood] = useState<FeelzMoodKey>("focus");

  useEffect(() => {
    const key = window.location.hash.replace("#", "");
    if (VALID_MOODS.includes(key as FeelzMoodKey)) setActiveMood(key as FeelzMoodKey);
  }, []);
  const [openIngredient, setOpenIngredient] = useState<{ mood: FeelzMoodKey; index: number } | null>(null);

  const activeStyle = MOOD_STYLES[activeMood];
  const ingredients = FEELZ_INGREDIENTS[activeMood];
  const drawerIngredient = openIngredient ? FEELZ_INGREDIENTS[openIngredient.mood][openIngredient.index] : null;

  return (
    <div className="bg-feelz-cream">
      {/* 01. Page hero */}
      <section className="border-b border-feelz-ink/10 bg-feelz-paper">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-berry">Ingredients</p>
          <h1 className="font-display mt-4 text-4xl font-bold leading-[1.1] text-feelz-ink sm:text-5xl">
            Know Your <span className="font-tagline italic">Ingredients</span>
          </h1>
          <p className="mt-4 text-sm font-medium text-feelz-ink/70 sm:text-base">Ancient wisdom. Modern formulation.</p>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-feelz-ink/60">
            Every ingredient has a reason to be here. FEELZ brings together traditional botanicals, researched
            compounds and nutritional ingredients — each selected for a specific role within a particular formula.
          </p>

          <div className="mx-auto mt-8 flex w-fit flex-wrap justify-center gap-2 rounded-full border border-feelz-ink/10 bg-feelz-cream p-1.5">
            {MOOD_GRID.map((mood) => {
              const style = MOOD_STYLES[mood.key];
              const colors = FEELZ_COLOR_CLASSES[style.feelzColor];
              const active = activeMood === mood.key;
              return (
                <button
                  key={mood.key}
                  type="button"
                  onClick={() => setActiveMood(mood.key as FeelzMoodKey)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-label transition ${
                    active ? `${colors.bg} text-feelz-cream` : "text-feelz-ink/60 hover:text-feelz-ink"
                  }`}
                >
                  {mood.label}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs text-feelz-ink/50">Choose a state. Meet the ingredients behind it.</p>
        </div>
      </section>

      {/* 02–05. Per-mood ingredient cards */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-berry">FEELZ {MOOD_LABELS[activeMood]}</p>
          <h2 className="font-display mt-2 text-3xl font-bold text-feelz-ink sm:text-4xl">
            {activeMood === "focus" && "Focus, formulated."}
            {activeMood === "joy" && "Joy, without the noise."}
            {activeMood === "extrovert" && "The social formula."}
            {activeMood === "rest" && "When the day is over — but your brain isn't."}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-feelz-ink/60">{activeStyle.description}</p>
          <p className="mt-3 text-xs font-semibold uppercase tracking-label text-feelz-ink/40">
            {ingredients.length} ingredients. One {activeMood === "focus" ? "focused" : activeMood === "joy" ? "more balanced" : activeMood === "extrovert" ? "social" : "restful"} state.
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ingredients.map((ingredient, index) => {
            const colors = FEELZ_COLOR_CLASSES[activeStyle.feelzColor];
            return (
              <button
                key={ingredient.name}
                type="button"
                onClick={() => setOpenIngredient({ mood: activeMood, index })}
                className="group flex flex-col rounded-2xl border border-feelz-ink/10 bg-feelz-paper p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {ingredient.image && (
                  <div className="relative mb-4 h-28 w-full overflow-hidden rounded-xl bg-white">
                    <Image
                      src={ingredient.image}
                      alt={ingredient.name}
                      fill
                      sizes="(min-width: 1024px) 20vw, 45vw"
                      className="object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                )}
                <span className={`w-fit rounded-full ${colors.bgTint} px-2.5 py-1 text-[10px] font-semibold uppercase tracking-label ${colors.text}`}>
                  {ingredient.amount}
                  {ingredient.standardization ? ` · ${ingredient.standardization}` : ""}
                </span>
                <span className="font-display mt-3 text-base font-bold text-feelz-ink">{ingredient.name}</span>
                <span className="font-tagline mt-1.5 text-sm italic text-feelz-ink/70">{ingredient.cardHeadline}</span>
                <span className="mt-2 text-xs leading-relaxed text-feelz-ink/50">{ingredient.cardHook}</span>
                <span className={`mt-4 flex items-center gap-1 text-xs font-semibold uppercase tracking-label ${colors.text}`}>
                  Learn more
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 06. Cross-product ingredient module */}
      <section className="border-y border-feelz-ink/10 bg-feelz-paper py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="text-center">
            <h2 className="font-display text-2xl font-bold text-feelz-ink sm:text-3xl">One ingredient. Different roles.</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-feelz-ink/60">
              The same ingredient can play a different role depending on the formula around it. Because FEELZ isn&apos;t
              about individual ingredients alone — it&apos;s about formulation.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {FEELZ_CROSS_INGREDIENT.map((item) => (
              <div key={item.name} className="rounded-2xl border border-feelz-ink/10 bg-feelz-cream p-5">
                <p className="font-display text-lg font-bold text-feelz-ink">{item.name}</p>
                <ul className="mt-3 space-y-3">
                  {item.roles.map((role) => (
                    <li key={role.mood} className="border-t border-feelz-ink/10 pt-3 first:border-t-0 first:pt-0">
                      <span className={`text-[11px] font-semibold uppercase tracking-label ${FEELZ_COLOR_CLASSES[MOOD_STYLES[role.mood].feelzColor].text}`}>
                        {role.label}
                      </span>
                      <p className="mt-1 text-xs leading-relaxed text-feelz-ink/60">{role.role}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 07. Closing section */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-berry">The FEELZ Formula</p>
        <h2 className="font-display mt-3 text-3xl font-bold text-feelz-ink sm:text-4xl">Every ingredient has a job.</h2>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-feelz-ink/60">
          From a tea-leaf amino acid to an Ayurvedic botanical. From saffron to melatonin. From black pepper extract to
          Vitamin B6. FEELZ isn&apos;t built around one magic ingredient — it&apos;s built around formulation, bringing
          different ingredients together for different moments of your day.
        </p>

        <div className="mx-auto mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
          {MOOD_GRID.map((mood) => {
            const style = MOOD_STYLES[mood.key];
            const colors = FEELZ_COLOR_CLASSES[style.feelzColor];
            return (
              <Link
                key={mood.key}
                href={`/feelz/${mood.key}`}
                className="rounded-2xl border border-feelz-ink/10 bg-feelz-paper p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className={`font-display block text-sm font-bold ${colors.text}`}>{mood.label}</span>
                <span className="mt-1 block text-[11px] text-feelz-ink/50">{style.stateLine}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 08. Research / transparency block */}
      <section className="border-t border-feelz-ink/10 bg-feelz-paper py-14">
        <div className="mx-auto max-w-2xl px-4 text-center sm:px-6">
          <h2 className="font-display text-xl font-bold text-feelz-ink">Want to go deeper?</h2>
          <p className="mt-3 text-sm leading-relaxed text-feelz-ink/60">
            We believe you should know what&apos;s inside the products you use. The research linked throughout this page
            is provided to explain the ingredients used in FEELZ and the scientific questions being explored around
            them. Ingredient research isn&apos;t the same thing as a clinical claim about a finished product — studies
            may use different extracts, preparations, doses, durations and participant groups from those used in FEELZ.
          </p>
        </div>
      </section>

      {/* 09. Final disclaimer */}
      <p className="mx-auto max-w-3xl px-4 py-8 text-center text-[11px] leading-relaxed text-feelz-ink/40 sm:px-6">
        <strong className="font-semibold text-feelz-ink/55">Research &amp; formulation note:</strong> {FEELZ_RESEARCH_DISCLAIMER}
      </p>

      {/* Ingredient detail drawer */}
      <Modal
        isOpen={!!drawerIngredient}
        onClose={() => setOpenIngredient(null)}
        title={drawerIngredient?.name ?? ""}
        bgClassName="bg-feelz-paper"
      >
        {drawerIngredient && (
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-label text-feelz-berry">
              {drawerIngredient.amount}
              {drawerIngredient.standardization ? ` · ${drawerIngredient.standardization}` : ""}
            </p>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-ink/40">What is it?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-feelz-ink/75">{drawerIngredient.whatIsIt}</p>
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-ink/40">Why is it in FEELZ?</p>
              <p className="mt-1.5 text-sm leading-relaxed text-feelz-ink/75">{drawerIngredient.whyInFeelz}</p>
            </div>

            <div className="rounded-xl border border-feelz-ink/10 bg-feelz-cream p-4">
              <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-ink/40">The research</p>
              <p className="mt-1.5 text-sm leading-relaxed text-feelz-ink/75">{drawerIngredient.research}</p>
              {drawerIngredient.researchUrl && (
                <a
                  href={drawerIngredient.researchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-label text-feelz-berry hover:underline"
                >
                  Read the research
                  <ArrowUpRight className="h-3 w-3" aria-hidden />
                </a>
              )}
            </div>

            <div>
              <p className="text-[11px] font-semibold uppercase tracking-label text-feelz-ink/40">A note on dosage</p>
              <p className="mt-1.5 text-xs leading-relaxed text-feelz-ink/55">{drawerIngredient.formulationNote}</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
