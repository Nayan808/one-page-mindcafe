import Image from "next/image";

/**
 * The standard dark hero backdrop: a page's photograph under the same
 * readability treatment the Feelz banner uses.
 *
 * WHY THIS EXISTS. The counselling, business and about heroes each carried
 * their own copy of an older stack — the photo at opacity-70 beneath a blanket
 * 0.55 -> 0.92 vertical scrim. A blanket scrim dims the copy side and the
 * subject side by the same amount, so the half of the frame that is meant to
 * carry the image gets flattened along with the half that only has to stay
 * legible. Next to /feelz those heroes read as dull.
 *
 * So: the photograph runs at full strength, and the shade is weighted to the
 * LEFT, where the copy actually sits, clearing entirely by 80% so the right
 * half stays a photograph rather than something behind a veil. The ramp is
 * held slightly darker and longer than the Feelz one because these pages set
 * their copy in a max-w-xl column that reaches further across the frame.
 *
 * Renders layers only — the caller owns the <section>, its base colour, and
 * everything above these in the stack.
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
        className="object-cover object-center opacity-95"
      />

      {/* Readability, left-weighted. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(97deg, rgba(21,12,28,0.94) 0%, rgba(21,12,28,0.88) 28%, rgba(21,12,28,0.6) 46%, rgba(21,12,28,0.22) 64%, rgba(0,0,0,0) 80%)",
        }}
        aria-hidden
      />
      {/* Mobile needs more: the copy sits over the artwork instead of beside
          it, so a vertical scrim is added only at small sizes. */}
      <div
        className="absolute inset-0 md:hidden"
        style={{
          background:
            "linear-gradient(to bottom, rgba(21,12,28,0.88) 0%, rgba(21,12,28,0.6) 45%, rgba(21,12,28,0.82) 100%)",
        }}
        aria-hidden
      />

      {/* Soft vignette to seat the frame. */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ boxShadow: "inset 0 0 180px 40px rgba(10,6,14,0.55)" }}
        aria-hidden
      />
    </>
  );
}
