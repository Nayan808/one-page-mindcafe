"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Pointer parallax for the hero banners.
 *
 * Returns a ref to attach to the hero shell and a smoothed -1..1 offset to
 * feed into transforms. Apply it to several layers at different magnitudes —
 * the depth comes from layers moving at different rates, not from any one
 * layer moving far.
 *
 * Opts out entirely under prefers-reduced-motion and on coarse pointers, so
 * touch devices never pay for a listener they cannot drive. The easing factor
 * is deliberately low (0.04): the layer keeps gliding for a moment after the
 * cursor stops, which is what stops it reading as a cursor-follow gimmick.
 */
export function useHeroPointer<T extends HTMLElement>(reduced: boolean) {
  const ref = useRef<T>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (reduced) return;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    let raf = 0;
    const target = { x: 0, y: 0 };
    const current = { x: 0, y: 0 };

    const onMove = (e: MouseEvent) => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      target.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      target.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    };

    const tick = () => {
      current.x += (target.x - current.x) * 0.04;
      current.y += (target.y - current.y) * 0.04;
      setPointer({ x: current.x, y: current.y });
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf = requestAnimationFrame(tick);
    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf);
    };
  }, [reduced]);

  return { ref, pointer };
}
