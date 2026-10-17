import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ImageHero } from "@/components/hero/ImageHero";

// Homepage hero — the client's finished artwork (public/heroes/home.webp,
// from "MINDCAFE - HERO SECTIONS/1.png"), shown exactly; see ImageHero.
export function HomeHero() {
  return (
    <ImageHero
      src="/heroes/home.webp"
      alt="A couple on a video counselling session at home, with the four FEELZ packs."
      eyebrow="Support for your mind. For everyday wellbeing."
      title="Feel more like yourself,"
      accent="one step at a time."
      body="Online counselling, mental health self-assessments and everyday wellbeing support, all in one place."
      cta={{ left: 5.5, top: 64 }}
      mobileFocus="50%"
    >
      <Link href="/book-appointment" className="pill-btn group">
        Talk to an Expert
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
      </Link>
      <Link href="/feelz" className="pill-btn-outline group">
        Shop Feelz
        <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" aria-hidden />
      </Link>
    </ImageHero>
  );
}
