import { Clock, Laptop, Lock, UserCheck } from "lucide-react";
import { Reveal } from "@/components/Reveal";

const POINTS = [
  { title: "Private sessions", body: "Your conversations are confidential.", Icon: Lock },
  {
    title: "Qualified professionals",
    body: "Meet experts with clearly stated qualifications and areas of practice.",
    Icon: UserCheck,
  },
  { title: "Online, from anywhere", body: "Choose a session that fits your schedule.", Icon: Laptop },
  { title: "At your pace", body: "You decide when you're ready to begin.", Icon: Clock },
];

export function CounsellingPrivacySection() {
  return (
    <section className="bg-cream">
      <Reveal className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-center text-3xl font-bold text-ink sm:text-4xl">Your privacy comes first.</h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {POINTS.map(({ title, body, Icon }) => (
            <div key={title} className="rounded-2xl border border-ink/10 bg-white p-5 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-cream">
                <Icon className="h-5 w-5 text-ink" aria-hidden />
              </div>
              <h3 className="font-display mt-3 text-sm font-bold text-ink">{title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-ink/60">{body}</p>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
