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
  const MotionComponent = motion(as ?? "div") as React.ComponentType<Record<string, unknown>>;

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
