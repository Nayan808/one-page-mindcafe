"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";

// Journey timeline sourced verbatim from mindcafe.app/awards (the same
// company's live awards page) — copy and photography both, not invented.
const JOURNEY = [
  {
    date: "Dec 2021",
    title: "Official Launch of Mindcafe India",
    description: "Launched with a mission to provide accessible, affordable mental health services and build a compassionate community for everyone.",
    image: "/awards/journey/mindcafe-launch.webp",
  },
  {
    date: "Feb 2022",
    title: "Top 5 Startups of Madhya Pradesh",
    description: "Recognized as a leading startup in MP — this milestone validated our mission and opened doors for collaborations to make mental health support more accessible.",
    image: "/awards/journey/startups-of-mp.webp",
  },
  {
    date: "Feb 2022",
    title: "First Mindcafe Meetup",
    description: "Our inaugural meetup brought advocates, professionals, and community members together, fostering open dialogue and meaningful connections.",
    image: "/awards/journey/mindcafe-meetup.webp",
  },
  {
    date: "March 2022",
    title: "Pitched Vision to MP's Chief Minister",
    description: "Presented our vision directly to the CM of Madhya Pradesh, emphasising mental health's importance at a policy level and strengthening collaborations.",
    image: "/awards/journey/cm-pitch.webp",
  },
  {
    date: "Sep 2022",
    title: "MIT-WPU Startup of the Year",
    description: 'Won "Startup of the Year" — highlighting our innovative approach and impact in mental wellness within just 7 months of launch.',
    image: "/awards/journey/startup-of-the-year-2022.webp",
  },
  {
    date: "Aug 2023",
    title: "Expanded into B2B Services",
    description: "Introduced holistic workplace well-being programs, helping organisations create healthier and more productive environments.",
    image: "/awards/journey/b2b.webp",
  },
  {
    date: "May 2024",
    title: "Maternal Mental Health Workshop",
    description: "On Mother's Day, hosted a workshop addressing postpartum stress and self-care, breaking the stigma around maternal mental health.",
    image: "/awards/journey/mothers-day.webp",
  },
  {
    date: "June 2024",
    title: "Celebrated International Yoga Day",
    description: "Organised a yoga session at an old-age home, promoting physical and emotional well-being among the elderly.",
    image: "/awards/journey/yoga-day.webp",
  },
  {
    date: "June 2024",
    title: "Woman Entrepreneur of the Year 2024",
    description: "Founder Sneh Nigam received this prestigious award at Startup Mahakumbh, inaugurated by PM Modi, for her dedication to mental health innovation.",
    image: "/awards/journey/women-entrepreneur-2024.webp",
  },
  {
    date: "August 2024",
    title: "Emotional Well-being at Tata Steel",
    description: "Conducted workshops across Tata Steel plants, equipping employees with tools to manage stress, improve resilience, and enhance workplace wellness.",
    image: "/awards/journey/tata-steel-org.webp",
  },
  {
    date: "Sep 2024",
    title: "Fox Story — Women Faces of the Year",
    description: "Founder Sneh Nigam honoured for her contributions to mental health advocacy, inspiring deeper conversations around mental health accessibility.",
    image: "/awards/journey/women-faces-fox-story.webp",
  },
  {
    date: "Oct 2024",
    title: "World Mental Health Day Walkathon",
    description: "Organised a large-scale walkathon in Bhopal, raising awareness and breaking the stigma surrounding mental health through solidarity and education.",
    image: "/awards/journey/mental-health-day.webp",
  },
  {
    date: "Oct 2024",
    title: "Mental Health Events & Workshops",
    description: "Conducted workplace wellness sessions on stress management, work-life balance, and mindfulness, tailored to organisational needs.",
    image: "/awards/journey/mental-health-day-2.webp",
  },
  {
    date: "Oct 2025",
    title: "ICKA Award",
    description: "Recognised for large-scale awareness initiatives and community walkathons breaking the stigma surrounding mental health.",
    image: "/awards/journey/icka.webp",
  },
];

export function AwardsJourneySection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 75%", "end 55%"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);
  const glowOpacity = useTransform(scrollYProgress, [0, 0.05, 0.95, 1], [0, 1, 1, 0]);

  return (
    <section className="overflow-hidden bg-white">
      <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">our journey</p>
          <h2 className="font-display mt-2 text-2xl font-bold lowercase text-ink sm:text-3xl">
            every milestone, every <span className="font-tagline italic">step forward.</span>
          </h2>
        </div>

        <div ref={trackRef} className="relative mt-16 sm:mt-20">
          <div className="absolute left-6 top-0 bottom-0 w-px bg-ink/10 sm:left-1/2 sm:-translate-x-1/2" aria-hidden />
          <motion.div
            style={{ height: lineHeight }}
            className="absolute left-6 top-0 w-px bg-ink sm:left-1/2 sm:-translate-x-1/2"
            aria-hidden
          />
          <motion.div
            style={{ top: lineHeight, opacity: glowOpacity }}
            className="absolute left-6 -ml-1 h-2 w-2 rounded-full bg-ink shadow-[0_0_12px_3px_rgba(17,17,16,0.35)] sm:left-1/2 sm:-ml-1 sm:-translate-x-1/2"
            aria-hidden
          />

          <ul className="space-y-10 sm:space-y-14">
            {JOURNEY.map((entry, index) => {
              const isRight = index % 2 === 0;
              return (
                <li key={entry.title} className="relative">
                  <span className="absolute left-6 top-6 z-10 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink bg-white sm:left-1/2" aria-hidden />

                  <motion.div
                    initial={{ opacity: 0, x: isRight ? 28 : -28, y: 10 }}
                    whileInView={{ opacity: 1, x: 0, y: 0 }}
                    viewport={{ once: true, margin: "-64px" }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className={`ml-14 sm:ml-0 sm:w-[calc(50%-2.5rem)] ${isRight ? "sm:ml-auto" : "sm:mr-auto sm:text-right"}`}
                  >
                    <div className="overflow-hidden rounded-2xl border border-ink bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl">
                      <div className="relative aspect-[684/300] w-full">
                        <Image src={entry.image} alt={entry.title} fill className="object-cover" />
                      </div>
                      <div className="p-5">
                        <span className="font-display inline-block rounded-full bg-ink px-3 py-1 text-xs font-bold text-cream">
                          {entry.date}
                        </span>
                        <h3 className="font-display mt-3 text-lg font-bold text-ink">{entry.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{entry.description}</p>
                      </div>
                    </div>
                  </motion.div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
