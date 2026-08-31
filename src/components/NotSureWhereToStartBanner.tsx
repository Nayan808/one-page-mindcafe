import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

// A single reassuring beat right after the hero, before anything asks the
// visitor to make a choice (a therapy category, a specific expert) — for
// someone who doesn't yet know which of those they need. Points at the
// self-assessment (/self-assessment), the one existing feature built
// exactly for "help me figure out where to start".
export function NotSureWhereToStartBanner() {
  return (
    <section className="bg-cream">
      <Reveal className="mx-auto max-w-2xl px-4 py-12 text-center sm:px-6">
        <h2 className="font-display text-2xl font-bold text-ink sm:text-3xl">Not sure where to start?</h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-ink/60 sm:text-base">
          That&apos;s okay. Tell us a little about what you&apos;re going through and we&apos;ll help you find the
          right place to begin.
        </p>
        <Link href="/self-assessment" className="pill-btn mt-6 inline-flex items-center gap-1.5">
          Take the Self-Assessment
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      </Reveal>
    </section>
  );
}
