import { Brain, Compass, Flame, Heart, HeartCrack, Users } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const CONCERNS = [
  { title: "Stress & overwhelm", body: "When everything starts feeling like too much.", Icon: Brain },
  { title: "Anxiety", body: "When worry becomes difficult to switch off.", Icon: HeartCrack },
  {
    title: "Relationships",
    body: "When communication, trust or conflict starts weighing on you.",
    Icon: Users,
  },
  {
    title: "Self-esteem",
    body: "When the way you see yourself gets in the way of how you live.",
    Icon: Heart,
  },
  {
    title: "Work & burnout",
    body: "When constant pressure starts affecting your mind and everyday life.",
    Icon: Flame,
  },
  {
    title: "Life transitions",
    body: "When you're navigating change, uncertainty or a difficult decision.",
    Icon: Compass,
  },
];

export function CounsellingConcernsSection() {
  return (
    <section className="bg-white">
      <Reveal className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            You don&apos;t need a diagnosis to ask for support
          </h2>
          <p className="mt-3 text-sm text-ink/60">Counselling can help you work through things like:</p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CONCERNS.map(({ title, body, Icon }) => (
            <div key={title} className="flex items-start gap-3 rounded-2xl border border-ink/10 p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-cream">
                <Icon className="h-4.5 w-4.5 text-ink" aria-hidden />
              </div>
              <div>
                <h3 className="font-display text-sm font-bold text-ink">{title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-ink/60">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
