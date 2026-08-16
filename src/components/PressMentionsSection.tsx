"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Reveal } from "@/components/Reveal";

// Homepage-only, placed as the last section in page.tsx so it lands
// right before the (global, layout-level) <Footer>. Grayscale-by-default
// with a color reveal on hover, matching the site's monochrome theme
// rather than the full-color animated treatment of the design this was
// adapted from — a plain bordered-tile grid reads more consistent with
// the rest of the page than a cycling carousel would, and there's no
// need for carousel mechanics with a fixed set of 10 logos anyway. The
// tile entrance (blur + spring, one-shot on scroll into view) mirrors
// that reference's per-logo animation feel without porting its cycling
// AnimatePresence machinery.
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
        <Reveal className="text-center">
          <p className="text-[11px] font-semibold uppercase tracking-label text-ink/50">As Seen On</p>
        </Reveal>

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {PRESS.map((item, index) => (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
                mass: 1,
                delay: index * 0.06,
              }}
              className="flex h-20 items-center justify-center rounded-2xl border border-ink/15 bg-white px-4 grayscale transition-all duration-300 hover:grayscale-0 hover:shadow-md"
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
