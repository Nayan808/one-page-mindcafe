import Image from "next/image";
import Link from "next/link";
import { Cog, GraduationCap, Globe2, HeartHandshake, Trophy, Users } from "lucide-react";
import { AwardsJourneySection } from "@/components/AwardsJourneySection";

// Copy and photography sourced verbatim from mindcafe.app/awards (the
// same company's live awards page) rather than invented.
const FEATURED = [
  {
    image: "/business/women-faces-foxstory.webp",
    year: "2024",
    tag: "national recognition",
    title: "Fox Story — Women Faces of the Year",
    description: "Founder Sneh Nigam honored for her contributions to mental health advocacy, inspiring deeper conversations around mental health accessibility across India.",
  },
  {
    image: "/business/women-entrepreneur.webp",
    year: "2024",
    tag: "startup mahakumbh",
    title: "Women Entrepreneur of the Year 2024",
    description: "Awarded at Startup Mahakumbh, inaugurated by PM Modi — recognising Sneh Nigam's dedication to mental health innovation and accessible wellness solutions.",
  },
  {
    image: "/business/startup-of-year.webp",
    year: "2022",
    tag: "mit-wpu",
    title: "Startup of the Year 2022",
    description: "Won at MIT-WPU within just 7 months of launch — highlighting our innovative approach and measurable impact in mental wellness across India.",
  },
];

const IMPACT_STATS = [
  { value: "20K+", label: "People helped across India" },
  { value: "100+", label: "Certified counselling experts" },
  { value: "96%", label: "Client satisfaction rate" },
  { value: "3yr", label: "Of continuous impact" },
];

const OTHER_RECOGNITION = [
  {
    Icon: Trophy,
    title: "Top 5 Most Innovative Startups of MP",
    description: "Featured on the Madhya Pradesh Most Innovative Startups panel.",
  },
  {
    Icon: Users,
    title: "10K+ Organic Instagram Followers",
    description: "Grew an organic wellness community within a year of launch.",
  },
  {
    Icon: Globe2,
    title: "Inspired 3K+ Global Leaders",
    description: "Shared mental health solutions on international stages.",
  },
  {
    Icon: Cog,
    title: "Tata Steel Wellness Partner",
    description: "Conducted well-being workshops across Tata Steel plants pan-India.",
  },
  {
    Icon: GraduationCap,
    title: "Educational Institution Partner",
    description: "Delivered student and staff mental wellness programs.",
  },
  {
    Icon: HeartHandshake,
    title: "Community Mental Health Leader",
    description: "Organized India's largest mental health walkathon in Bhopal.",
  },
];

export default function AwardsPage() {
  return (
    <div>
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <span className="rounded-full border border-cream/25 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-label text-cream/70">
            since december 2021
          </span>
          <h1 className="font-display mx-auto mt-6 max-w-xl text-4xl font-bold lowercase leading-[1.05] sm:text-5xl">
            awards &amp; <span className="font-tagline italic">achievements.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm text-cream/70 sm:text-base">
            From a single startup in Bhopal to a <strong className="text-cream">nationally recognised mental
            wellness platform</strong> — every milestone is a reflection of the community that made it possible.
          </p>

          <div className="mx-auto mt-10 grid max-w-2xl grid-cols-2 gap-6 sm:grid-cols-4">
            {[
              { value: "3+", label: "National Awards" },
              { value: "13+", label: "Milestones" },
              { value: "3yr", label: "Of Impact" },
              { value: "20K+", label: "Lives Touched" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="font-display text-2xl font-bold sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-label text-cream/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">featured recognition</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
              three awards that define our <span className="font-tagline italic">commitment.</span>
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {FEATURED.map((award) => (
              <div key={award.title} className="overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-lg">
                <div className="relative aspect-[1010/440] w-full">
                  <Image src={award.image} alt={award.title} fill className="object-cover" />
                  <span className="font-display absolute right-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-bold text-cream">
                    {award.year}
                  </span>
                </div>
                <div className="p-5 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">{award.tag}</p>
                  <h3 className="font-display mt-1.5 text-base font-bold text-ink">{award.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{award.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <AwardsJourneySection />

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">impact by numbers</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
              the results speak <span className="font-tagline italic">for themselves.</span>
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-4">
            {IMPACT_STATS.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-ink/15 p-6 text-center">
                <p className="font-display text-3xl font-bold text-ink sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-ink/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">other recognition</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
              recognised by <span className="font-tagline italic">leaders across India.</span>
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {OTHER_RECOGNITION.map((item) => (
              <div key={item.title} className="flex items-start gap-4 rounded-2xl border border-ink/15 p-5 text-left">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ink/10 bg-cream">
                  <item.Icon className="h-5 w-5 text-ink" aria-hidden />
                </div>
                <div>
                  <h3 className="font-display text-sm font-bold text-ink">{item.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink/60">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <h2 className="font-display text-2xl font-bold lowercase text-ink sm:text-3xl">
            be part of the <span className="font-tagline italic">next chapter.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-ink/60">
            The best milestones are the ones we make together. Join Mindcafé in building a mentally healthier India.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/counselling" className="pill-btn">
              book a session →
            </Link>
            <Link href="/business" className="pill-btn-outline">
              partner with us
            </Link>
            <Link href="/about" className="pill-btn-outline">
              our story
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
