"use client";

import * as React from "react";
import { motion, useInView, type Variants } from "motion/react";

const DEFAULT_VARIANTS: Variants = {
  visible: (i: number) => ({
    y: 0,
    opacity: 1,
    filter: "blur(0px)",
    transition: {
      delay: i * 0.2,
      duration: 0.5,
    },
  }),
  hidden: {
    filter: "blur(10px)",
    y: -20,
    opacity: 0,
  },
};

type TimelineContentProps<T extends React.ElementType> = {
  as?: T;
  animationNum: number;
  timelineRef: React.RefObject<HTMLElement | null>;
  customVariants?: Variants;
  children: React.ReactNode;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children">;

export function TimelineContent<T extends React.ElementType = "div">({
  as,
  animationNum,
  timelineRef,
  customVariants,
  children,
  ...props
}: TimelineContentProps<T>) {
  const isInView = useInView(timelineRef, { once: true, amount: 0.2 });
  // motion(...)/motion.create(...) must only be called once per element
  // type, not on every render — calling it inline in the render body hands
  // React a new component identity each time, which forces an unmount +
  // remount of the underlying DOM node on every re-render (e.g. whenever
  // cart state changes and Hero re-renders). That remount restarts the
  // "hidden" -> "visible" entrance animation from scratch, which looks
  // exactly like the whole section "refreshing" on every click elsewhere
  // on the page. Memoizing keyed on `as` keeps the same component identity
  // across re-renders, so the animation only ever plays once.
  const MotionComponent = React.useMemo(
    () => motion.create(as ?? "div") as React.ComponentType<Record<string, unknown>>,
    [as],
  );

  return (
    <MotionComponent
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      custom={animationNum}
      variants={customVariants ?? DEFAULT_VARIANTS}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}
