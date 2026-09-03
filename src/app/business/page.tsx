"use client";

import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Phone, PenTool, Rocket, Star, TrendingUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { getRecentReviews } from "@/lib/api";
import { BusinessLeadForm } from "@/components/BusinessLeadForm";
import { Reveal } from "@/components/Reveal";

// Copy and imagery sourced from mindcafe.app/businesses (the same company's
// live corporate-wellness page) rather than invented — stats, the offering
// breakdown, org types, process steps, and award images are what the
// business already publishes.
const OFFERINGS = [
  {
    image: "/business/offerings/counselling-program.webp",
    title: "Counselling program",
    description: "Confidential 1:1 sessions with certified professionals for stress and anxiety management.",
  },
  {
    image: "/business/offerings/mental-wellness.webp",
    title: "Wellness workshops",
    description: "Interactive group sessions on emotional resilience, communication, and burnout prevention.",
  },
  {
    image: "/business/offerings/brain-performance.webp",
    title: "Brain performance tools",
    description: "Feelz wellness strips, self-help courses, guided journals, and digital resources for the team.",
  },
];

const STATS = ["20,000+ people served", "20+ organisations partnered", "20,000+ sessions completed", "96% satisfaction"];

const ORG_TYPES = [
  {
    image: "/business/who-we-work-with/startup.webp",
    title: "Startups scaling under pressure",
    description: "Mental health solutions for startups navigating rapid growth and pressure.",
  },
  {
    image: "/business/who-we-work-with/corporate.webp",
    title: "Corporates managing large teams",
    description: "Workforce wellness programs for corporates managing large, diverse teams.",
  },
  {
    image: "/business/who-we-work-with/university.webp",
    title: "Universities supporting students & staff",
    description: "Mental health support systems for universities empowering students and staff.",
  },
  {
    image: "/business/who-we-work-with/travel.webp",
    title: "Hospitality & travel teams with dynamic workforces",
    description: "Wellbeing solutions for hospitality and travel teams with dynamic workforces.",
  },
  {
    image: "/business/who-we-work-with/ngo.webp",
    title: "NGOs & mission-led organisations",
    description: "Mental health partnerships for NGOs and mission-driven organisations.",
  },
  {
    image: "/business/who-we-work-with/manufacturing.webp",
    title: "Manufacturing / field-force teams",
    description: "Workforce wellness programs for manufacturing and field-force teams.",
  },
];

const COMPANY_LOGOS = [
  "/business/companies/tata-steel.png",
  "/business/companies/zostel.png",
  "/business/companies/reliance-foundation.png",
  "/business/companies/humans-of-bombay.png",
  "/business/companies/path.png",
  "/business/companies/galaxy-basmati-rice.png",
];

// translateX(-50%) only loops seamlessly if each half of the track is
// already wider than the widest screen it renders on — 6 logos alone fall
// way short of that on a desktop viewport, which is why the marquee used
// to visibly run out and go blank before looping. Repeat the set several
// times to build one comfortably-wide "half", then lay that whole half
// down twice back to back for the actual loop.
const MARQUEE_HALF = Array.from({ length: 8 }, () => COMPANY_LOGOS).flat();
const MARQUEE_LOGOS = [...MARQUEE_HALF, ...MARQUEE_HALF];

const AWARDS = [
  {
    image: "/business/women-faces-foxstory.webp",
    title: "Women Faces of the Year: Fox Story",
    description: "Named a Top 10 trailblazing woman leader in mental wellness and entrepreneurship.",
  },
  {
    image: "/business/women-entrepreneur.webp",
    title: "Women Entrepreneur of the Year 2024",
    description: "Recognized by PM Modi at Startup Mahakumbh for innovation in mental health solutions.",
  },
  {
    image: "/business/startup-of-year.webp",
    title: "Startup of the Year 2022",
    description: "Awarded by MIT WPU with trophy and cash prize for outstanding impact in mental health.",
  },
];

const PROCESS_STEPS = [
  {
    Icon: Phone,
    label: "01: Discovery",
    title: "Understand your needs",
    description: "Free discovery call to learn your team size, culture, challenges, and wellness goals.",
  },
  {
    Icon: ClipboardList,
    label: "02: Diagnose",
    title: "Assess & identify",
    description: "Anonymous stress audit and team survey to identify key risk areas and priority gaps.",
  },
  {
    Icon: PenTool,
    label: "03: Design",
    title: "Custom roadmap",
    description: "Tailored program combining counselling, workshops, and tools, built for your organisation.",
  },
  {
    Icon: Rocket,
    label: "04: Deliver",
    title: "Program launch",
    description: "We roll out sessions and workshops with minimal disruption to your operations.",
  },
  {
    Icon: TrendingUp,
    label: "05: Measure",
    title: "Track & improve",
    description: "Outcome dashboards, anonymous feedback, and regular check-ins to continuously improve.",
  },
];

function CorporateTestimonials() {
  // Corporate-flagged reviews specifically (spec 4.7) — reuses the same
  // reviews table the consumer teaser reads, just scoped differently.
  const reviewsQuery = useQuery({
    queryKey: ["reviews", "corporate"],
    queryFn: async () => {
      const sb = createClient();
      const all = await getRecentReviews(sb, 20);
      return all.filter((r) => r.is_corporate);
    },
  });
  const reviews = (reviewsQuery.data ?? []).slice(0, 3);
  if (!reviewsQuery.isLoading && reviews.length === 0) return null;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <h2 className="font-display text-center text-3xl font-bold text-ink sm:text-4xl">What teams say</h2>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        {reviews.map((review) => (
          <div key={review.id} className="rounded-2xl border border-ink/10 bg-cream p-5 text-left text-sm">
            <div className="flex gap-0.5 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3.5 w-3.5" fill={i < review.rating ? "currentColor" : "none"} aria-hidden />
              ))}
            </div>
            {review.comment && <p className="mt-3 text-ink/70">&ldquo;{review.comment}&rdquo;</p>}
            <p className="mt-3 text-xs font-medium text-ink/50">{review.reviewer_name}</p>
          </div>
        ))}
      </div>
      </div>
    </section>
  );
}

export default function BusinessPage() {
  return (
    <div>
      <section className="relative overflow-hidden text-[#f6efe4]" style={{ backgroundColor: "#150c1c" }}>
        <Image src="/business-hero.jpg" alt="" fill priority sizes="100vw" className="object-cover opacity-70" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(21,12,28,0.55) 0%, rgba(21,12,28,0.72) 55%, rgba(21,12,28,0.92) 100%)",
          }}
          aria-hidden
        />

        <div
          className="pointer-events-none absolute right-[8%] top-1/2 hidden -translate-y-1/2 lg:flex xl:right-[16%]"
          aria-hidden
        >
          <div className="relative h-[280px] w-[280px] overflow-hidden rounded-full border border-[#f6efe4]/25 shadow-lg xl:h-[340px] xl:w-[340px]">
            <Image src="/hero-badges/business.jpg" alt="" fill sizes="340px" className="object-cover" />
          </div>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-28">
          <div className="max-w-xl">
            <span className="inline-block rounded-full border border-[#f4ead9]/25 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-label text-[#f4ead9]/80">
              Build Healthier Teams
            </span>
            <h1 className="font-display mt-6 text-5xl font-bold leading-[1.05] text-[#f6efe4] sm:text-6xl">
              Improve <span className="font-tagline italic text-brand-blush">team performance.</span>
            </h1>
            <div className="mt-6 h-px w-12 bg-[#f6efe4]/25" aria-hidden />
            <p className="mt-6 max-w-lg text-sm text-[#f4ead9]/70 sm:text-base">
              For companies, universities, startups, and institutions seeking structured mental wellness solutions
              through counselling, workshops, and performance tools.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a href="#get-in-touch" className="btn-cine-primary">
                Partner With Us →
              </a>
              <a href="#whats-included" className="btn-cine-secondary">
                Explore Offerings
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-4">
          {STATS.map((stat) => (
            <div key={stat} className="rounded-xl border border-ink/25 bg-white p-4 text-center">
              <p className="font-display text-sm font-bold text-ink sm:text-base">{stat}</p>
            </div>
          ))}
        </div>
        </div>
      </section>

      <section className="bg-white">
        <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-label text-ink/50">Who We Work With</p>
        <h2 className="font-display mt-2 text-center text-3xl font-bold text-ink sm:text-4xl">
          Built for every type of <span className="font-tagline italic text-brand">organisation</span>.
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {ORG_TYPES.map((org) => (
            <div key={org.title} className="rounded-2xl border border-ink/15 p-6 text-center shadow-sm">
              <div className="relative mx-auto h-16 w-16">
                <Image src={org.image} alt="" fill className="object-contain" />
              </div>
              <h3 className="font-display mt-3 text-lg font-bold text-ink">{org.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{org.description}</p>
            </div>
          ))}
        </div>
        </Reveal>
      </section>

      <section className="bg-white">
        <Reveal className="py-10">
        <p className="text-center text-[11px] font-semibold uppercase tracking-label text-ink/40">Trusted by teams at</p>
        <div
          className="relative mt-6 overflow-hidden"
          style={{ maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" }}
        >
          <div className="marquee-track flex w-max items-center gap-16" style={{ animation: "marquee 208s linear infinite" }}>
            {MARQUEE_LOGOS.map((logo, index) => (
              <div key={`${logo}-${index}`} className="relative h-8 w-28 shrink-0">
                <Image src={logo} alt="" fill className="object-contain" />
              </div>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      <section className="bg-white">
        <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-label text-ink/50">Recognition & Impact</p>
        <h2 className="font-display mt-2 text-center text-3xl font-bold text-ink sm:text-4xl">
          Making an impact, <span className="font-tagline italic text-brand">together</span>.
        </h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {AWARDS.map((award) => (
            <div key={award.title} className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-lg">
              <div className="relative aspect-[1010/440] w-full">
                <Image src={award.image} alt={award.title} fill className="object-cover" />
              </div>
              <div className="p-5 text-left">
                <h3 className="font-display text-base font-bold text-ink">{award.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{award.description}</p>
              </div>
            </div>
          ))}
        </div>
        </Reveal>
      </section>

      <section className="bg-white">
        <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="text-center text-[11px] font-semibold uppercase tracking-label text-ink/50">How It Works</p>
        <h2 className="font-display mt-2 text-center text-3xl font-bold text-ink sm:text-4xl">
          From enquiry to <span className="font-tagline italic text-brand">lasting impact</span>.
        </h2>

        <div className="relative mt-16">
          <div className="absolute top-8 hidden h-px bg-ink/15 sm:block" style={{ left: "8%", right: "8%" }} aria-hidden />
          <div className="absolute bottom-6 left-8 top-6 w-px bg-ink/15 sm:hidden" aria-hidden />

          <div className="relative flex flex-col gap-10 sm:flex-row sm:justify-between">
            {PROCESS_STEPS.map((step) => (
              <div key={step.title} className="relative flex items-start gap-5 sm:flex-1 sm:flex-col sm:items-center sm:text-center">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white shadow-sm">
                  <step.Icon className="h-6 w-6 text-ink" aria-hidden />
                </div>

                <div className="pt-1 sm:mt-4 sm:pt-0">
                  <p className="text-[11px] font-semibold uppercase tracking-label text-ink/40">{step.label}</p>
                  <h3 className="font-display mt-1 text-base font-bold text-ink sm:text-lg">{step.title}</h3>
                  <p className="mt-1 max-w-[13rem] text-xs leading-snug text-ink/60 sm:mx-auto sm:text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        </Reveal>
      </section>

      <section id="whats-included" className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="font-display text-center text-3xl font-bold text-ink sm:text-4xl">What&apos;s included</h2>
        <div className="mt-10 grid gap-5 sm:grid-cols-3">
          {OFFERINGS.map((offering) => (
            <div key={offering.title} className="overflow-hidden rounded-2xl border border-ink/15 shadow-sm">
              <div className="relative aspect-[2109/745] w-full">
                <Image src={offering.image} alt={offering.title} fill className="object-cover" />
              </div>
              <div className="p-5 text-center">
                <h3 className="font-display text-lg font-bold text-ink">{offering.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{offering.description}</p>
              </div>
            </div>
          ))}
        </div>
        </div>
      </section>

      <CorporateTestimonials />

      <section
        id="get-in-touch"
        className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-cream sm:-mt-12 sm:rounded-t-[3rem]"
      >
        <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="font-display text-3xl font-bold text-ink sm:text-4xl">
            Grow with <span className="font-tagline italic text-brand">Mindcafe.</span>
          </h2>
          <p className="mt-3 text-sm text-ink/60">Tell us about your team and we&apos;ll get back within a business day.</p>
        </div>
        <div className="mt-8">
          <BusinessLeadForm />
        </div>
        </div>
      </section>
    </div>
  );
}
