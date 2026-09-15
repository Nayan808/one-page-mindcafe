"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Volume2, VolumeX } from "lucide-react";
import { useInView } from "motion/react";
import { Reveal } from "@/components/Reveal";

// Copy, pull-quote, and video sourced verbatim from mindcafe.app/about (the
// same company's live "our story" section) rather than invented. The video
// is the company's own real YouTube upload.
const YOUTUBE_VIDEO_ID = "GNa-LL2vylk";
const VIDEO_TITLE = "Mindcafe's CEO & Founder, Sneh Nigam talks about Mindcafe";

type YTPlayer = { mute: () => void; unMute: () => void; isMuted: () => boolean };

declare global {
  interface Window {
    YT?: { Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoadPromise: Promise<void> | null = null;
function loadYouTubeIframeApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve();
  if (apiLoadPromise) return apiLoadPromise;
  apiLoadPromise = new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.body.appendChild(script);
  });
  return apiLoadPromise;
}

// Autoplays muted (the only way any browser allows autoplay at all) the
// moment the video scrolls into view, loops, and is click-to-unmute —
// no separate "click to load a thumbnail" step first. The static
// thumbnail stays put *underneath* the player the whole time: the YT
// player only actually paints its iframe once the API's finished loading
// and the player's ready, so without it there'd be a blank black box for
// that brief window instead of an instant, already-familiar frame.
export function StorySection() {
  const frameRef = useRef<HTMLDivElement>(null);
  const playerElRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YTPlayer | null>(null);
  const isInView = useInView(frameRef, { once: true, amount: 0.4 });
  const [isMuted, setIsMuted] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!isInView || !playerElRef.current) return;
    let cancelled = false;
    loadYouTubeIframeApi().then(() => {
      if (cancelled || !playerElRef.current || !window.YT) return;
      playerRef.current = new window.YT.Player(playerElRef.current, {
        videoId: YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: 1,
          mute: 1,
          loop: 1,
          playlist: YOUTUBE_VIDEO_ID,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: { onReady: () => setIsReady(true) },
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isInView]);

  function toggleMute() {
    const player = playerRef.current;
    if (!player) return;
    if (player.isMuted()) {
      player.unMute();
      setIsMuted(false);
    } else {
      player.mute();
      setIsMuted(true);
    }
  }

  return (
    <section>
      <Reveal className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="overflow-hidden rounded-3xl border border-ink shadow-lg">
            <div ref={frameRef} className="group relative aspect-video w-full bg-ink">
              <Image src="/about/story-video-thumb.jpg" alt={VIDEO_TITLE} fill className="object-cover" />
              <div ref={playerElRef} className="absolute inset-0 h-full w-full" />
              {/* A real YouTube iframe, once mounted, is a separate
                  browsing context — clicks landing on it never reach a
                  parent element's onClick. This overlay sits above it (DOM
                  order + no explicit z-index on either = later wins) so
                  clicking anywhere on the video reliably toggles mute
                  instead of silently doing nothing the moment the player
                  becomes ready. */}
              <button
                type="button"
                onClick={toggleMute}
                disabled={!isReady}
                aria-label={isReady ? (isMuted ? "Unmute video" : "Mute video") : VIDEO_TITLE}
                className="absolute inset-0 h-full w-full"
              >
                {isReady && (
                  <span className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-ink/60 text-cream backdrop-blur transition group-hover:bg-ink/80">
                    {isMuted ? <VolumeX className="h-4 w-4" aria-hidden /> : <Volume2 className="h-4 w-4" aria-hidden />}
                  </span>
                )}
              </button>
            </div>
            <div className="flex items-center gap-2 bg-ink px-5 py-3">
              <span aria-hidden>🎙️</span>
              <p className="font-tagline text-sm italic text-cream/80">
                &ldquo;We built Mindcafe because we knew there was a better way.&rdquo;
              </p>
            </div>
          </div>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">Our Story</p>
            <h2 className="font-display mt-2 text-4xl font-bold leading-[1.1] text-ink sm:text-5xl">
              A simple belief that <span className="font-tagline italic text-brand">changed everything.</span>
            </h2>
            <blockquote className="font-tagline mt-6 border-l-2 border-ink/20 pl-4 text-lg italic text-ink/80">
              &ldquo;Taking care of your brain shouldn&apos;t feel like a last resort.&rdquo;
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
              Start Your Journey →
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
