import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  CheckCircle2,
  Factory,
  GraduationCap,
  Landmark,
  Laptop,
  Leaf,
  MessageCircle,
  Moon,
  Package,
  Plane,
  ScanLine,
  Search,
  ShieldCheck,
  Sparkles,
  HeartHandshake as Collab,
} from "lucide-react";

// Product-safety content sourced verbatim from mindcafe.app/trust (the
// same company's live page) rather than invented — ingredients,
// certifications, dosage warnings, and manufacturing claims all come
// directly from there. The digital-trust section further down (data
// privacy, payments, account security) is this app's own scope — the
// live page is entirely about the physical Feelz product, this app also
// handles accounts and payments, so both belong here.
const TRUST_PILLARS = [
  { Icon: CheckCircle2, label: "Nutraceutical Grade" },
  { Icon: Leaf, label: "Natural Ingredients" },
  { Icon: Factory, label: "Certified Manufacturing" },
  { Icon: Search, label: "Full Label Transparency" },
  { Icon: Landmark, label: "India Regulatory Compliant" },
];

const PRINCIPLES = [
  {
    Icon: CheckCircle2,
    title: "safety first",
    description: "Every ingredient in Feelz has an established safety profile. We do not use compounds with unknown or contested safety records.",
  },
  {
    Icon: Sparkles,
    title: "genuine effectiveness",
    description: "Ingredients are selected based on traditional wellness use and research-backed associations with mental performance and wellbeing.",
  },
  {
    Icon: Leaf,
    title: "everyday compatibility",
    description: "Formulations are designed to fit seamlessly into real life — no need to build routines around them. Open. Place. Dissolve.",
  },
];

const INGREDIENTS = [
  { name: "Ashwagandha (KSM-66)", tag: "GRAS Status" },
  { name: "Bacopa Monnieri", tag: "Traditional Use" },
  { name: "L-Theanine", tag: "Research-Backed" },
  { name: "Melatonin (0.5mg)", tag: "WHO-Listed" },
  { name: "Valerian Root Extract", tag: "Traditional Use" },
  { name: "Saffron Extract", tag: "Research-Backed" },
  { name: "Magnesium Glycinate", tag: "GRAS Status" },
  { name: "Rhodiola Rosea", tag: "Traditional Use" },
];

const SELECTION_STEPS = [
  { title: "safety profile", description: "Only ingredients with established, documented safety records approved for dietary supplement use in India." },
  { title: "wellness efficacy", description: "Traditionally associated with mental performance, emotional balance, and cognitive support through decades of use." },
  { title: "lifestyle fit", description: "Dosages designed for daily or occasional use — not requiring clinical supervision for healthy adults." },
];

const MANUFACTURING_STEPS = [
  { Icon: BarChart3, tag: "QC", title: "ingredient verification", description: "Every raw ingredient is verified for identity, purity, and compliance before entering production." },
  { Icon: Factory, tag: "GMP", title: "controlled environments", description: "Manufacturing takes place in certified facilities with controlled temperature, humidity, and cleanliness standards." },
  { Icon: Package, tag: "QA", title: "packaging integrity", description: "Each unit is checked for packaging seal integrity, correct labelling, and product consistency before dispatch." },
  { Icon: ScanLine, tag: "traceability", title: "batch-level monitoring", description: "Every batch is tracked from raw ingredients to finished product, ensuring full traceability and accountability." },
];

const USE_CASES = [
  { Icon: Plane, title: "travel fatigue", description: "Beat the mental drain of long journeys, new environments, and constant adaptation." },
  { Icon: Laptop, title: "work exhaustion", description: "Support focus and clarity through demanding professional schedules." },
  { Icon: GraduationCap, title: "study demands", description: "Maintain cognitive performance during exam periods and intensive study." },
  { Icon: Moon, title: "sleep preparation", description: "Wind down naturally before bed for deeper, more restful sleep." },
];

const CERTIFICATIONS = [
  { title: "FSSAI Guidelines", description: "Food Safety and Standards Authority of India compliance" },
  { title: "GMP Certified Facilities", description: "Manufacturing partners meet Good Manufacturing Practice standards" },
  { title: "Nutraceutical Standards", description: "All products comply with India Schedule I & II supplement regulations" },
];

const LABEL_ELEMENTS = [
  { title: "Ingredients Used", description: "Full ingredient list with quantities, no proprietary blends" },
  { title: "Suggested Usage", description: "Clear dosage instructions for each variant and pack size" },
  { title: "Product Format & Benefits", description: "What the product does, for whom, and when to use it" },
  { title: "Storage Instructions", description: "Temperature, light, and humidity guidance for potency" },
  { title: "Expiry & Batch Code", description: "Full traceability on every pack for quality assurance" },
];

const USAGE_STEPS = [
  { step: "1", title: "open the pack", description: "Each pack is sealed for freshness. Open just before use." },
  { step: "2", title: "place on your tongue", description: "Let the strip rest on your tongue — do not chew." },
  { step: "3", title: "allow it to dissolve", description: "The strip dissolves naturally within seconds. No water required." },
  { step: "4", title: "follow daily limits", description: "Do not exceed the recommended usage stated on your product's packaging." },
];

const CONSULT_LIST = [
  "Are pregnant or nursing",
  "Have existing medical conditions",
  "Are taking prescribed medication",
  "Are under 18 years of age",
  "Have known allergies to any listed ingredients",
];

const IMPROVEMENT_AREAS = [
  { Icon: MessageCircle, title: "customer feedback", description: "Every review, message, and complaint shapes our next product iteration." },
  { Icon: BookOpen, title: "wellness research", description: "We stay current with nutraceutical science and wellness research from India and globally." },
  { Icon: ShieldCheck, title: "safety standards", description: "As regulatory guidelines evolve, we update our formulations and processes accordingly." },
  { Icon: Collab, title: "expert collaboration", description: "We work with healthcare professionals, psychologists, and wellness practitioners in our product development." },
];

const DIGITAL_TRUST_SECTIONS = [
  {
    title: "data privacy",
    body: "Your account details, order history, and anything shared in a counselling session are stored securely and never sold to third parties. Payment details are handled entirely by Razorpay — this app never sees or stores your card/UPI information directly.",
  },
  {
    title: "payments & refunds",
    body: "Every order — Feelz products and counselling sessions alike — is paid in full upfront through Razorpay at checkout; nothing is collected later or on delivery. Because payment is collected upfront and orders are processed right away, we're unable to offer refunds or cancellations once an order is placed, so please review your cart or session details before confirming. If something arrives damaged, incorrect, or a session needs rescheduling, reach out and we'll help sort it out.",
  },
  {
    title: "session confidentiality",
    body: "What you share with a counsellor stays between you and them, with the standard safety exceptions any licensed professional follows (like risk of harm to yourself or others) — always explained upfront, never a surprise.",
  },
  {
    title: "account security",
    body: "Sign in with Google or an email one-time code; either way, access to your data is scoped to your account only. If you ever suspect unauthorized access, reach out and we'll help immediately.",
  },
];

export default function TrustPage() {
  return (
    <div>
      <section className="bg-ink text-cream">
        <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
          <h1 className="font-display mx-auto max-w-xl text-3xl font-bold lowercase leading-[1.15] sm:text-4xl">
            our commitment to <span className="font-tagline italic">safety &amp; transparency.</span>
          </h1>
          <p className="mt-4 text-sm text-cream/70 sm:text-base">
            At Mindcafé, we believe mental wellness products should be built on a foundation of safety,
            responsibility, and transparency. Every step of product development — from ingredient selection to
            manufacturing — is guided by recognised safety standards for nutraceutical products.
          </p>
          <div className="mx-auto mt-8 flex max-w-lg flex-wrap items-center justify-center gap-2">
            {TRUST_PILLARS.map((pillar) => (
              <span
                key={pillar.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-cream/25 px-3.5 py-1.5 text-xs font-medium text-cream/80"
              >
                <pillar.Icon className="h-3.5 w-3.5" aria-hidden />
                {pillar.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">what guides us</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
              three principles that guide <span className="font-tagline italic">everything we do.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink/60">
              Feelz products are designed to support everyday mental wellbeing through convenient, on-the-go wellness
              formats. We don&apos;t take shortcuts — every part of Feelz is held to a standard we&apos;d be
              comfortable with ourselves, and confidently recommend to our own families.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-3">
            {PRINCIPLES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-ink bg-white p-6 text-center shadow-lg">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-ink/10 bg-cream">
                  <item.Icon className="h-5 w-5 text-ink" aria-hidden />
                </div>
                <h3 className="font-display mt-4 text-lg font-bold lowercase text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">ingredients — sample</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">key feelz ingredients.</h2>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-2.5">
            {INGREDIENTS.map((ing) => (
              <span key={ing.name} className="rounded-full border border-ink/15 px-4 py-2 text-xs text-ink">
                <span className="font-semibold">{ing.name}</span>
                <span className="ml-1.5 text-ink/45">· {ing.tag}</span>
              </span>
            ))}
          </div>
          <p className="mx-auto mt-6 max-w-md text-center text-xs text-ink/50">
            Full ingredient list on each product label. Quantities comply with India nutraceutical guidelines.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">carefully selected</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
              you know exactly what <span className="font-tagline italic">you&apos;re taking.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink/60">
              Feelz formulations use ingredients well-established in the nutraceutical and wellness industry — many
              rooted in traditional Indian wellness practice (Ashwagandha, Brahmi, Bacopa), refined with modern
              scientific understanding. We never use proprietary blends to obscure quantities.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {SELECTION_STEPS.map((step) => (
              <div key={step.title} className="rounded-2xl border border-ink/15 p-6 text-center">
                <h3 className="font-display text-base font-bold lowercase text-ink">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">responsible manufacturing</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
              consistent quality. <span className="font-tagline italic">every single batch.</span>
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {MANUFACTURING_STEPS.map((step) => (
              <div key={step.title} className="rounded-2xl border border-ink/15 p-5 text-left">
                <div className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-cream">
                  <step.Icon className="h-5 w-5 text-ink" aria-hidden />
                </div>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-label text-ink/40">{step.tag}</p>
                <h3 className="font-display mt-1 text-sm font-bold lowercase text-ink">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink/60">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">designed for everyday wellness</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
              a wellness tool. <span className="font-tagline italic">not a medicine.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink/60">
              Feelz products are developed as wellness support tools, not as pharmaceutical treatments — designed to
              support everyday mental wellness in situations most modern Indians face regularly.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USE_CASES.map((item) => (
              <div key={item.title} className="rounded-2xl border border-ink/15 p-5 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-cream">
                  <item.Icon className="h-5 w-5 text-ink" aria-hidden />
                </div>
                <h3 className="font-display mt-3 text-sm font-bold lowercase text-ink">{item.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink/60">{item.description}</p>
              </div>
            ))}
          </div>
          <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-4 text-center text-xs leading-relaxed text-amber-800">
            Feelz products are not designed to diagnose, treat, or cure any medical condition. They are not a
            substitute for professional medical or mental health care.
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">regulatory compliance</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
              aligned with india&apos;s <span className="font-tagline italic">nutraceutical regulations.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink/60">
              Feelz products are developed to align with nutraceutical safety guidelines and regulatory standards
              applicable in India. We work exclusively with certified manufacturing partners that follow recognised
              quality and Good Manufacturing Practice (GMP) standards.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {CERTIFICATIONS.map((cert) => (
              <div key={cert.title} className="flex items-start gap-3 rounded-2xl border border-ink/15 p-5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-ink" aria-hidden />
                <div>
                  <h3 className="font-display text-sm font-bold text-ink">{cert.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink/60">{cert.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">transparency</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
              every label tells <span className="font-tagline italic">the full story.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink/60">
              We believe customers should always know what they are consuming — no ambiguity, no omissions.
            </p>
          </div>

          <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-start">
            <ul className="space-y-3">
              {LABEL_ELEMENTS.map((el) => (
                <li key={el.title} className="rounded-xl border border-ink/15 p-4">
                  <h3 className="font-display text-sm font-bold text-ink">{el.title}</h3>
                  <p className="mt-1 text-xs leading-relaxed text-ink/60">{el.description}</p>
                </li>
              ))}
            </ul>

            <div className="rounded-2xl border border-ink bg-white p-6 shadow-lg">
              <p className="text-[11px] font-semibold uppercase tracking-label text-ink/40">sample product label</p>
              <h3 className="font-display mt-1 text-lg font-bold text-ink">Feelz Calm</h3>
              <p className="text-xs text-ink/50">Melt-in-mouth wellness strip · 30 strips · 15g</p>
              <dl className="mt-4 space-y-2 text-xs text-ink/70">
                <div className="flex justify-between gap-4 border-t border-ink/10 pt-2">
                  <dt className="text-ink/45">Serving</dt>
                  <dd className="text-right">1 strip as needed</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-ink/10 pt-2">
                  <dt className="text-ink/45">Category</dt>
                  <dd className="text-right">Nutraceutical supplement</dd>
                </div>
                <div className="border-t border-ink/10 pt-2">
                  <dt className="text-ink/45">Ingredients</dt>
                  <dd className="mt-1">
                    Ashwagandha (KSM-66) 200mg, Chamomile Extract 100mg, L-Theanine 50mg, Hydroxypropyl
                    Methylcellulose (carrier), Natural flavour, Steviol glycosides (sweetener)
                  </dd>
                </div>
                <div className="border-t border-ink/10 pt-2">
                  <dt className="text-ink/45">Warnings</dt>
                  <dd className="mt-1">
                    Not a medicine. Keep out of reach of children. Store in a cool, dry place below 25°C. Consult a
                    healthcare professional if pregnant, nursing, or on medication.
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">responsible usage</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
              use feelz <span className="font-tagline italic">safely &amp; effectively.</span>
            </h2>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {USAGE_STEPS.map((step) => (
              <div key={step.title} className="rounded-2xl border border-ink/15 p-5 text-center">
                <span className="font-display mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-ink text-sm font-bold text-cream">
                  {step.step}
                </span>
                <h3 className="font-display mt-3 text-sm font-bold lowercase text-ink">{step.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink/60">{step.description}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-ink/15 p-6">
            <h3 className="font-display text-sm font-bold text-ink">Please consult a healthcare professional if you:</h3>
            <ul className="mt-3 space-y-1.5 text-sm text-ink/70">
              {CONSULT_LIST.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink/40" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-ink/50">
              These precautions apply to all nutraceutical and dietary supplement products. When in doubt, always
              check with your doctor before introducing a new supplement.
            </p>
          </div>

          <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber-300 bg-amber-50 p-4 text-center text-xs leading-relaxed text-amber-800">
            The Sleep strip contains 0.5mg Melatonin — a low, clinically referenced dose. It should only be used
            before bedtime. Do not drive or operate machinery after taking the Sleep variant.
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">continuous improvement</p>
            <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
              we never stop <span className="font-tagline italic">getting better.</span>
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink/60">
              Good enough is not good enough. We listen, we learn, and we evolve — because your trust depends on it.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {IMPROVEMENT_AREAS.map((area) => (
              <div key={area.title} className="rounded-2xl border border-ink/15 p-5 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 bg-cream">
                  <area.Icon className="h-5 w-5 text-ink" aria-hidden />
                </div>
                <h3 className="font-display mt-3 text-sm font-bold lowercase text-ink">{area.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-ink/60">{area.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 text-center sm:px-6">
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">everyday support, not a replacement</p>
          <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
            feelz is everyday support. <span className="font-tagline italic">not a replacement.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink/60">
            Mental wellbeing is complex and deeply personal. Feelz products support everyday lifestyle challenges —
            they are not a replacement for professional mental health care. If you&apos;re experiencing ongoing
            emotional distress or a condition requiring clinical support, Mindcafé&apos;s 1:1 counselling connects
            you with certified professionals in a private, judgment-free space.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/counselling" className="pill-btn">
              book a session →
            </Link>
            <Link href="/counselling" className="pill-btn-outline">
              learn more
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
          <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-center text-xs font-medium text-amber-800">
            DRAFT — pending legal/compliance review, not final copy.
          </div>

          <div className="text-center">
            <ShieldCheck className="mx-auto h-8 w-8 text-ink" aria-hidden />
            <h2 className="font-display mt-3 text-2xl font-bold lowercase text-ink">digital trust &amp; data privacy</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink/60">
              The above covers what&apos;s in every Feelz strip — this part covers your account, payments, and data.
            </p>
          </div>

          <div className="mt-10 space-y-8">
            {DIGITAL_TRUST_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="font-display text-lg font-bold lowercase text-ink">{section.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/70">{section.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 rounded-xl border border-ink/10 bg-cream p-4">
            <ShieldCheck className="h-4 w-4 text-ink/60" aria-hidden />
            <span className="text-sm font-medium text-ink">ISO/IEC 27001 — information security aligned</span>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto max-w-lg px-4 pb-20 text-center sm:px-6">
          <h2 className="font-display text-xl font-bold lowercase text-ink">have questions about safety?</h2>
          <p className="mt-2 text-sm text-ink/60">
            If you&apos;d like more information about Feelz products, ingredients, or usage guidelines — our team
            would be happy to help.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <a href="mailto:team@mindcafe.app" className="text-sm font-semibold text-ink underline">
              contact mindcafé support →
            </a>
            <Link href="/feelz" className="text-sm font-semibold text-ink underline">
              back to feelz
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
