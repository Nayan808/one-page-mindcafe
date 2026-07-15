import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";

// Homepage hero — the scroll-driven expanding-media component
// (src/components/ui/scroll-expansion-hero.tsx), fed the site's own
// video/background assets (public/homepage/) and copy. The tagline + the
// two top-level nav paths (shop Feelz, book counselling) live in
// `children`, revealed once the media finishes expanding — same CTAs the
// static hero used to show up front, just later in the scroll sequence.
export function HomeHero() {
  return (
    // Pulled up by the sticky header's own height (4.5rem, same constant
    // the pre-redesign hero used) so the hero starts at the true top of
    // the viewport and slides underneath the header, instead of the
    // header pushing it down — that's what lets the header sit transparent
    // over the hero's video/image at the top instead of over plain page
    // background. Header.tsx switches itself solid once scrolling starts.
    <div className="-mt-[4.5rem]">
      <ScrollExpandMedia
        mediaType="video"
        mediaSrc="/homepage/herosectionvideo.mp4"
        posterSrc="/homepage/herosectionimagebg.jpeg"
        bgImageSrc="/homepage/herosectionimagebg.jpeg"
        title="mindcafé that cares your brain"
        scrollToExpand="scroll to feel it"
      >
        <div className="mx-auto max-w-xl text-center">
          <p className="font-tagline text-lg italic text-ink/70 sm:text-xl">
            feelz mood strips for the day-to-day. 1:1 counselling with certified experts for everything else.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/feelz" className="pill-btn">
              explore feelz
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link href="/counselling" className="pill-btn-outline">
              book counselling
            </Link>
          </div>
        </div>
      </ScrollExpandMedia>
    </div>
  );
}
