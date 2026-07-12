import { Check } from "lucide-react";

const TRIGGERS = [
  "You're tired in a way sleep doesn't fix.",
  "Small things have started feeling like a lot.",
  "You keep saying \"I'm fine\" when you're not sure you are.",
  "Something's off in a relationship and you can't quite name it.",
  "You want to talk to someone who isn't a friend or family member.",
];

// Static marketing copy (spec 4.4) — relatable, non-clinical language
// rather than diagnostic claims, since this is a landing page, not a
// screening tool (that's what /assessment is for, Phase 3).
export function EmotionalChecklistSection() {
  return (
    <section className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
      <h2 className="font-display text-2xl font-bold lowercase text-ink sm:text-3xl">does any of this sound familiar?</h2>
      <ul className="mx-auto mt-8 max-w-md space-y-3 text-left">
        {TRIGGERS.map((trigger) => (
          <li key={trigger} className="flex items-start gap-3 rounded-xl border border-ink/10 bg-white p-4 text-sm text-ink/80">
            <Check className="mt-0.5 h-4 w-4 shrink-0 text-ink" aria-hidden />
            {trigger}
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-ink/60">That's exactly what counselling is for.</p>
    </section>
  );
}
