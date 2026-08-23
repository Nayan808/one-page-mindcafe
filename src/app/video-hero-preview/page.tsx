"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ScrollFrameHeroLazy } from "@/components/scroll-frame/ScrollFrameHeroLazy";
import { DEFAULT_GRADE, type ColorGrade } from "@/components/scroll-frame/ScrollFrameHero";

// Isolated preview for the scroll-scrubbed frame sequence. Nothing here is
// wired into the real homepage — the existing ScrollExpandMedia hero is
// untouched, as asked.
//
// The tall spacer below the hero is deliberate: scrub progress is measured
// against the hero element's own height, so there has to be real page length
// to scroll THROUGH before the sequence can play from first frame to last.
export default function VideoHeroPreview() {
  const [grade, setGrade] = useState<ColorGrade>(DEFAULT_GRADE);

  const set = <K extends keyof ColorGrade>(key: K, value: ColorGrade[K]) =>
    setGrade((g) => ({ ...g, [key]: value }));

  return (
    <div className="bg-cream">
      <ScrollFrameHeroLazy grade={grade} scrollLength="320vh">
        <div className="relative z-10 flex h-full items-center justify-center px-4 sm:px-6">
          <div className="mx-auto max-w-3xl py-24 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-label text-cream/55">
              Mindcafe
            </p>
            <h1 className="font-display mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-cream sm:text-6xl xl:text-7xl">
              Mindcafe that cares
              <br className="hidden sm:block" /> for your brain
            </h1>
            <p className="font-tagline mx-auto mt-6 max-w-xl text-lg italic text-cream/75 sm:text-xl">
              Feelz mood strips for the day-to-day. 1:1 counselling with certified experts for
              everything else.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/feelz" className="pill-btn">
                Shop Feelz
                <ArrowRight className="h-3.5 w-3.5" aria-hidden />
              </Link>
              <Link
                href="/book-appointment"
                className="pill-btn-outline !border-cream/45 !text-cream hover:!bg-cream/10"
              >
                Book Consultation
              </Link>
            </div>
            <p className="mt-10 text-xs uppercase tracking-label text-cream/40">
              scroll to scrub
            </p>
          </div>
        </div>
      </ScrollFrameHeroLazy>

      <div className="mx-auto max-w-2xl px-6 pb-32">
        <h2 className="font-display text-3xl font-bold text-ink">Sequence complete</h2>
        <p className="mt-3 text-sm text-ink/60">
          The hero above holds frame 1 at rest, drifts gently through the opening two seconds
          while unscrolled, then scrubs the full 96-frame sequence as this page scrolls past it.
        </p>
      </div>

      {/* Live colour-grade panel. Values map straight onto the canvas filter
          chain, so whatever looks right here is what gets passed as props. */}
      <aside className="fixed bottom-4 right-4 z-50 w-64 rounded-2xl border border-ink/15 bg-cream/95 p-4 text-xs shadow-lg backdrop-blur">
        <p className="font-semibold uppercase tracking-label text-ink/70">Colour grade</p>

        <Slider label="hue" min={-40} max={40} step={1} value={grade.hue} onChange={(v) => set("hue", v)} suffix="°" />
        <Slider label="saturation" min={0} max={2} step={0.05} value={grade.saturation} onChange={(v) => set("saturation", v)} />
        <Slider label="brightness" min={0.5} max={1.6} step={0.05} value={grade.brightness} onChange={(v) => set("brightness", v)} />
        <Slider label="contrast" min={0.5} max={1.6} step={0.05} value={grade.contrast} onChange={(v) => set("contrast", v)} />
        <Slider label="tint amount" min={0} max={0.6} step={0.02} value={grade.tintAmount} onChange={(v) => set("tintAmount", v)} />

        <div className="mt-3">
          <p className="mb-1 text-ink/60">tint colour</p>
          <div className="flex flex-wrap gap-1.5">
            {[
              ["blush", "#cf96af"],
              ["purple", "#a66c98"],
              ["cream", "#f6f1e6"],
              ["navy", "#2d4160"],
            ].map(([name, hex]) => (
              <button
                key={hex}
                type="button"
                onClick={() => set("tint", hex)}
                className={`rounded-full border px-2 py-1 text-[10px] ${
                  grade.tint === hex ? "border-ink text-ink" : "border-ink/20 text-ink/60"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setGrade(DEFAULT_GRADE)}
          className="mt-3 w-full rounded-full border border-ink/20 py-1.5 text-[11px] text-ink/70 hover:border-ink/40"
        >
          reset
        </button>

        <pre className="mt-3 overflow-x-auto rounded-lg bg-ink/5 p-2 text-[10px] leading-relaxed text-ink/70">
{`grade={{
  hue: ${grade.hue},
  saturation: ${grade.saturation},
  brightness: ${grade.brightness},
  contrast: ${grade.contrast},
  tint: "${grade.tint}",
  tintAmount: ${grade.tintAmount},
}}`}
        </pre>
      </aside>
    </div>
  );
}

function Slider({
  label,
  min,
  max,
  step,
  value,
  onChange,
  suffix = "",
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <label className="mt-2.5 block">
      <span className="flex justify-between text-ink/60">
        {label}
        <span className="font-mono text-ink/80">
          {value}
          {suffix}
        </span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-brand"
      />
    </label>
  );
}
