"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import { Reveal } from "@/components/Reveal";

// Copy, pull-quote, and video sourced verbatim from mindcafe.app/about (the
// same company's live "our story" section) rather than invented. The video
// is the company's own real YouTube upload — clicking play loads and plays
// that actual video via YouTube's embed player, not a placeholder.
const YOUTUBE_VIDEO_ID = "GNa-LL2vylk";
const VIDEO_TITLE = "Mindcafe's CEO & Founder, Sneh Nigam talks about Mindcafe";

export function StorySection() {
  const [playing, setPlaying] = useState(false);

  return (
    <section className="bg-white">
      <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-3xl border border-ink shadow-lg">
            <div className="relative aspect-video w-full bg-ink">
              {playing ? (
                <iframe
                  src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1`}
                  title={VIDEO_TITLE}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="group absolute inset-0 flex items-center justify-center"
                  aria-label={`Play video: ${VIDEO_TITLE}`}
                >
                  <Image src="/about/story-video-thumb.jpg" alt={VIDEO_TITLE} fill className="object-cover" />
                  <span className="absolute inset-0 bg-ink/35 transition group-hover:bg-ink/45" aria-hidden />
                  <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-cream shadow-lg transition group-hover:scale-105">
                    <Play className="h-6 w-6 translate-x-0.5 text-ink" fill="currentColor" aria-hidden />
                  </span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 bg-ink px-5 py-3">
              <span aria-hidden>🎙️</span>
              <p className="font-tagline text-sm italic text-cream/80">
                &ldquo;We built Mindcafe because we knew there was a better way.&rdquo;
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">our story</p>
            <h2 className="font-display mt-2 text-3xl font-bold lowercase leading-[1.1] text-ink sm:text-4xl">
              a simple belief that <span className="font-tagline italic">changed everything.</span>
            </h2>
            <blockquote className="font-tagline mt-6 border-l-2 border-ink/20 pl-4 text-lg italic text-ink/80">
              &ldquo;taking care of your brain shouldn&apos;t feel like a last resort.&rdquo;
            </blockquote>
            <div className="mt-6 space-y-4 text-sm leading-relaxed text-ink/60 sm:text-base">
              <p>
                It shouldn&apos;t require a crisis, it shouldn&apos;t feel complicated, and it definitely shouldn&apos;t
                feel inaccessible. But for millions of people, it still does.
              </p>
              <p>
                We built Mindcafe to close that gap. Starting with 1:1 counselling and a community platform, we&apos;ve
                grown into a full mental wellness ecosystem, now introducing{" "}
                <strong className="font-semibold text-ink">Feelz by Mindcafe</strong>, melt-in-mouth wellness strips
                designed for the way modern India actually lives.
              </p>
              <p>
                Every product, program, and conversation at Mindcafe is guided by one goal:{" "}
                <strong className="font-semibold text-ink">
                  making mental wellness practical, accessible, and stigma-free.
                </strong>
              </p>
            </div>
            <Link
              href="/counselling"
              className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-ink underline underline-offset-4"
            >
              start your journey →
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
