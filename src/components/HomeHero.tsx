import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ScrollExpandMedia from "@/components/ui/scroll-expansion-hero";

// Homepage hero — the scroll-driven expanding-media component
// (src/components/ui/scroll-expansion-hero.tsx), fed the site's own
// video/background assets (public/homepage/) and copy. The "shop feelz" /
// "book consultation" CTAs sit in `belowTitle`, always visible right
// under the title — not gated behind the scroll-expand reveal like
// `children` (the tagline) is, since these are the two links someone
// should be able to reach immediately, before scrolling at all.
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
        title="mindcafe that cares for your brain"
        scrollToExpand="scroll to feelz it"
        belowTitle={
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/feelz" className="pill-btn">
              shop feelz
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
            <Link href="/book-appointment" className="pill-btn-outline !border-ink !text-white hover:!bg-white/10">
              book consultation
            </Link>
          </div>
        }
      >
        <div className="mx-auto max-w-xl text-center">
          <p className="font-tagline text-lg italic text-ink/70 sm:text-xl">
            feelz mood strips for the day-to-day. 1:1 counselling with certified experts for everything else.
          </p>
        </div>
      </ScrollExpandMedia>
    </div>
  );
}
