import type { CSSProperties, ReactNode } from "react";

// Shared ambient background for the full-bleed, mood-coloured sections on
// product pages (HowToUseSection, FeelDifferenceSection). Drop it as the
// first child of a `relative isolate overflow-hidden` section. Layers:
// edge light/shade for depth, two slowly drifting glows, fine rings (one
// slowly turning), translucent "strips" floating like the product, two
// rows of huge outlined type drifting in opposite directions, and a fine
// film grain. Everything moves on long cycles so it reads as ambience,
// not activity; all of it stops under reduced-motion (.howto-* and
// .marquee-track in globals.css).
//
// `phrase` is the kinetic-type text (rendered twice per row so the
// shared -50% marquee loop is seamless). `mirror` flips the ring/glow
// placement so consecutive sections don't look stamped from one mould.
// `typeRows="bottom"` keeps only the lower type row, for sections whose
// header needs a clean field behind it.
export function MoodAmbience({
  phrase,
  mirror = false,
  typeRows = "both",
}: {
  phrase: ReactNode;
  mirror?: boolean;
  typeRows?: "both" | "bottom";
}) {
  const ringSide = mirror ? "-left-48" : "-right-48";
  const innerRingSide = mirror ? "-left-28" : "-right-28";
  const cornerRingSide = mirror ? "-right-24" : "-left-24";

  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
      {/* Depth: light from one top corner, shade toward the opposite bottom. */}
      <div
        className={`absolute inset-0 ${
          mirror
            ? "bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(0,0,0,0.28),transparent_60%)]"
            : "bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.22),transparent_55%),radial-gradient(ellipse_at_bottom_right,rgba(0,0,0,0.28),transparent_60%)]"
        }`}
      />
      {/* Slow drifting glows. */}
      <div className={`howto-glow absolute ${mirror ? "-right-40" : "-left-40"} top-1/3 h-[34rem] w-[34rem] rounded-full bg-white/15 blur-3xl`} />
      <div className={`howto-glow howto-glow-alt absolute ${mirror ? "-left-32" : "-right-32"} -top-24 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl`} />
      {/* Fine rings, partly off-canvas. */}
      <div className={`absolute ${ringSide} top-1/2 h-[46rem] w-[46rem] -translate-y-1/2 rounded-full border border-white/10`} />
      <div className={`howto-ring absolute ${innerRingSide} top-1/2 h-[34rem] w-[34rem] -translate-y-1/2 rounded-full border border-dashed border-white/20`} />
      <div className={`absolute ${cornerRingSide} -top-24 h-72 w-72 rounded-full border border-white/10`} />
      {/* Floating strips — the product's own shape. Kept to the side
          gutters (only shown from 2xl, where the max-w-7xl content leaves
          real margins) and to the vertical bands between the two type rows
          (top ≈30–43%, bottom ≈85–100%), so they never sit on text or
          content. One identical style for all four — no backdrop blur,
          which smeared whatever text happened to be behind one. */}
      {[
        "left-[3%] top-[10%] h-14 w-10 [--r:-14deg]",
        "left-[4%] top-[60%] h-12 w-8 [--r:18deg]",
        "right-[4%] top-[14%] h-12 w-8 [--r:16deg]",
        "right-[3%] top-[56%] h-14 w-10 [--r:-10deg]",
      ].map((position, index) => (
        <span
          key={position}
          className={`howto-strip absolute hidden rounded-md border border-white/35 bg-white/10 2xl:block ${position}`}
          style={{ animationDelay: `${index * -2.7}s` } as CSSProperties}
        />
      ))}
      {/* Kinetic type texture. */}
      {[
        { top: "top-[30%]", reverse: mirror, seconds: 70 },
        { top: "bottom-[2%]", reverse: !mirror, seconds: 85 },
      ]
        .filter((row) => typeRows === "both" || row.top.startsWith("bottom"))
        .map((row) => (
        <div key={row.top} className={`absolute inset-x-0 ${row.top} ${mirror ? "rotate-3" : "-rotate-3"}`}>
          <div
            className="marquee-track flex w-max"
            style={{ animation: `marquee ${row.seconds}s linear infinite${row.reverse ? " reverse" : ""}` }}
          >
            {[0, 1].map((copy) => (
              <span
                key={copy}
                className="font-display select-none whitespace-nowrap pr-12 text-[7rem] font-bold leading-none text-transparent sm:text-[10rem]"
                style={{ WebkitTextStroke: "1px rgba(255,255,255,0.16)" }}
              >
                {phrase} {phrase}
              </span>
            ))}
          </div>
        </div>
      ))}
      {/* Fine film grain so the colour reads as a material, not a fill. */}
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }}
      />
    </div>
  );
}
