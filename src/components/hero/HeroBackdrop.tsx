import Image from "next/image";

/**
 * The standard light hero backdrop: a page's photograph under a white
 * readability scrim, weighted to the LEFT where the copy column sits,
 * clearing entirely by 80% so the right half stays a photograph rather than
 * something behind a veil.
 *
 * Renders layers only — the caller owns the <section>, its base colour
 * (bg-cream, now flat white), and everything above these in the stack. The
 * scrim is plain white rather than a warm cream so it fades into that base
 * colour seamlessly instead of leaving a visible tint mismatch.
 */
export function HeroBackdrop({ src }: { src: string }) {
  return (
    <>
      <Image
        src={src}
        alt=""
        fill
        priority
        quality={90}
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Readability, left-weighted. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(97deg, rgba(255,255,255,0.96) 0%, rgba(255,255,255,0.9) 28%, rgba(255,255,255,0.66) 46%, rgba(255,255,255,0.28) 64%, rgba(255,255,255,0) 80%)",
        }}
        aria-hidden
      />
      {/* Mobile needs more: the copy sits over the artwork instead of beside
          it, so a vertical scrim is added only at small sizes. */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.68) 45%, rgba(255,255,255,0.9) 100%)",
        }}
        aria-hidden
      />
    </>
  );
}
