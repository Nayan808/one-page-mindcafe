"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";

// "Good things grow together." — partner logos + impact numbers, straight
// after the homepage hero. Rebuilt from the client's artwork ("Organisations
// that care about people's wellbeing..png") as live content so it can move:
// the logos are cut from that artwork (public/partners/*.png) and shown on
// the same #fcf9f7 ground with multiply blending, so their pale backgrounds
// disappear.
//
// Motion (.partners-* in globals.css), once the section scrolls into view:
// headline lines rise from a mask and the rule draws out; logos arrive one by
// one strip from a soft blur, then run as a slow marquee; the impact row's hairlines draw outward from the
// centre and each number counts up with an ease-out. Hover: a logo lifts
// slightly. Reduced-motion: final state, numbers shown at their value.

const LOGOS = [
  { key: "zostel", name: "Zostel", w: 211, h: 63 },
  { key: "tata", name: "Tata Steel", w: 252, h: 42 },
  { key: "hob", name: "Humans of Bombay", w: 137, h: 51 },
  { key: "reliance", name: "Reliance Foundation", w: 210, h: 86 },
  { key: "galaxy", name: "Galaxy Basmati Rice", w: 162, h: 103 },
  { key: "path", name: "PATH", w: 203, h: 90 },
];

const STATS = [
  { value: 20, format: (n: number) => `${Math.round(n)}K+`, label: "Lives impacted" },
  { value: 15, format: (n: number) => `${Math.round(n)}+`, label: "Satisfied EAP clients" },
  { value: 45000, format: (n: number) => `${Math.round(n).toLocaleString("en-IN")}+`, label: "Counselling hours delivered" },
];

function CountUp({ to, format, run, delay }: { to: number; format: (n: number) => string; run: boolean; delay: number }) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(to);
      return;
    }
    const duration = 2200;
    let frame = 0;
    const startAt = performance.now() + delay;
    const tick = (now: number) => {
      const t = Math.min(1, Math.max(0, (now - startAt) / duration));
      // ease-out expo: quick start, long, quiet settle
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(to * eased);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [run, to, delay]);
  return <>{format(value)}</>;
}

export function PartnersImpactSection() {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="bg-[#fcf9f7] py-16 sm:py-24">
      <div ref={ref} data-inview={inView ? "" : undefined} className="partners mx-auto max-w-[96rem] px-4 sm:px-6">
        <div className="text-center">
          <h2 className="font-serif-display text-4xl leading-tight text-[#26355d] sm:text-5xl lg:text-6xl">
            <span className="partners-mask">
              <span className="partners-rise" style={{ "--d": "0ms" } as CSSProperties}>
                Good things grow <span className="font-tagline italic text-[#9b5c78]">together.</span>
              </span>
            </span>
          </h2>
          <p className="partners-fade mt-4 text-sm text-[#6b6f85] sm:text-base" style={{ "--d": "250ms" } as CSSProperties}>
            Organisations that care about their team&apos;s wellbeing.
          </p>
          <span className="partners-rule mx-auto mt-5 block h-[3px] w-14 rounded-full bg-[#c98fa6]" aria-hidden />
        </div>

        {/* Running logo strip — the shared `marquee` keyframes; the list is
            rendered twice so the -50% loop is seamless (per-item right padding,
            not gap, keeps the halfway point exact). Edges fade out; hover
            pauses it. Logos keep the artwork's relative sizes, ×1.15. */}
        <div
          className="partners-logo partners-marquee mt-12 overflow-hidden sm:mt-16"
          style={{ "--d": "450ms", maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)" } as CSSProperties}
        >
          <ul className="marquee-track flex w-max items-center hover:[animation-play-state:paused]" style={{ animation: "marquee 40s linear infinite" }}>
            {[0, 1].map((copy) =>
              LOGOS.map((logo) => (
                <li key={`${copy}-${logo.key}`} className="shrink-0 px-10 sm:px-16" aria-hidden={copy === 1 ? true : undefined}>
                  <Image
                    src={`/partners/${logo.key}.png`}
                    alt={copy === 1 ? "" : logo.name}
                    width={logo.w}
                    height={logo.h}
                    style={{ height: Math.round(logo.h * 1.15), width: "auto" }}
                    className="max-w-none mix-blend-multiply transition-transform duration-500 ease-out hover:-translate-y-1"
                  />
                </li>
              )),
            )}
          </ul>
        </div>

        <div className="mt-16 sm:mt-20">
          <p
            className="partners-fade text-center text-[11px] font-semibold uppercase tracking-[0.35em] text-[#9b5c78]"
            style={{ "--d": "1100ms" } as CSSProperties}
          >
            Our impact
          </p>
          <div className="relative mt-5">
            <span className="partners-line absolute inset-x-0 top-0 h-px bg-[#e3d5da]" aria-hidden />
            <span className="partners-line absolute inset-x-0 bottom-0 h-px bg-[#e3d5da]" aria-hidden />
            <dl className="grid grid-cols-1 sm:grid-cols-3">
              {STATS.map((stat, index) => (
                <div
                  key={stat.label}
                  className={`partners-stat relative py-8 text-center sm:py-10 ${
                    index > 0 ? "border-t border-[#e3d5da] sm:border-l sm:border-t-0" : ""
                  }`}
                  style={{ "--d": `${1250 + index * 150}ms` } as CSSProperties}
                >
                  <dd className="font-serif-display text-5xl leading-none text-[#9b5c78] tabular-nums sm:text-6xl">
                    <CountUp to={stat.value} format={stat.format} run={inView} delay={1250 + index * 150} />
                  </dd>
                  <dt className="mt-3 text-sm text-[#26355d] sm:text-base">{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}
