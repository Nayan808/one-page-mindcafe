"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { RiseIn } from "@/components/motion/primitives";

// Homepage-only, placed as the last section in page.tsx so it lands
// right before the (global, layout-level) <Footer>. Grayscale-by-default
// with a color reveal on hover, matching the site's monochrome theme
// rather than the full-color animated treatment of the design this was
// adapted from — a plain bordered-tile grid reads more consistent with
// the rest of the page than a cycling carousel would, and there's no
// need for carousel mechanics with a fixed set of 10 logos anyway. The
// tile entrance is a one-shot blur-to-focus on scroll into view, eased
// rather than sprung, so the row settles as a single group — quiet
// credibility, not nine logos each announcing themselves.
const PRESS = [
  { name: "Brides", src: "/press/brides.png" },
  { name: "CNBC-TV18", src: "/press/cnbc-tv18.svg" },
  { name: "Cosmopolitan", src: "/press/cosmopolitan.svg" },
  { name: "Dainik Bhaskar", src: "/press/dainik-bhaskar.svg" },
  { name: "Deccan Herald", src: "/press/deccan-herald-wide.png" },
  { name: "NDTV", src: "/press/ndtv.svg" },
  { name: "Rajasthan Patrika", src: "/press/patrika.svg" },
  { name: "The Times of India", src: "/press/times-of-india.svg" },
  // Original full badge (not the cropped wordmark-only version) — just
  // sized a bit bigger than the shared default so it reads clearly.
  { name: "The Pioneer", src: "/press/pioneer.jpg", imgHeight: "h-16" },
  { name: "Zostel", src: "/press/zostel-press.png", imgHeight: "h-16" },
];

export function PressMentionsSection() {
  return (
    <section className="relative z-10 -mt-10 rounded-t-[2.5rem] bg-cream py-16 sm:-mt-12 sm:rounded-t-[3rem]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <RiseIn className="text-center" y={8} blur={3} amount={0.6}>
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">As Seen On</p>
        </RiseIn>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PRESS.map((item, index) => (
            <motion.div
              key={item.name}
              // Was a spring at stiffness 300 — it overshot and bounced,
              // which is exactly the register this page avoids. These are
              // credibility marks: they should settle, not pop. Shorter
              // offset and a tight stagger so the row arrives as ONE group
              // rather than as nine individually animated logos.
              initial={{ opacity: 0, y: 14, filter: "blur(5px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.35 }}
              transition={{ duration: 0.8, delay: index * 0.055, ease: [0.22, 0.61, 0.36, 1] }}
              // Tile styling (white fill, ink/15 border) is the newer design
              // and is kept as-is; only the motion was replaced, since the
              // spring it used to carry overshot and bounced.
              className="flex h-20 items-center justify-center rounded-2xl border border-ink/15 bg-white px-4 grayscale transition-all duration-500 ease-out hover:border-ink/30 hover:grayscale-0 hover:shadow-[0_10px_28px_-18px_rgba(77,42,57,0.4)]"
            >
              <div className={`relative w-full ${item.imgHeight ?? "h-9"}`}>
                <Image src={item.src} alt={item.name} fill sizes="180px" className="object-contain" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
