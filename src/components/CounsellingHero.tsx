import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageHero } from "@/components/hero/ImageHero";

// /counselling hero — the client's finished artwork (public/heroes/
// counselling.webp, from "MINDCAFE - HERO SECTIONS/2.png"), shown exactly;
// see ImageHero.
export function CounsellingHero() {
  return (
    <ImageHero
      src="/heroes/counselling.webp"
      alt="A calm, sunlit counselling room with an armchair and plants."
      eyebrow="Support for your mind. For everyday wellbeing."
      title="You don't have to"
      accent="figure it all out alone."
      body="1:1 support from qualified mental-health professionals, when you need space to understand what you're feeling, work through challenges, and move forward."
      cta={{ left: 2.6, top: 69 }}
      mobileFocus="55%"
    >
      <Link href="/book-appointment" className="pill-btn group">
        Book a Session
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
      </Link>
      <a href="#how-it-works" className="pill-btn-outline">
        How It Works
      </a>
    </ImageHero>
  );
}
