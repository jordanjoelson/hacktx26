"use client";

import { useEffect } from "react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";

// 450ms: the flight is the confirmation and has to travel ~100px along a curve; shorter reads as vanishing.
const FLIGHT = 0.45;
// Dips just below 0 so the plane crouches back ~3px first, then accelerates out.
const FLIGHT_EASE = [0.45, -0.25, 0.8, 0.4] as const;

// Quadratic curve in px from where the plane rests. The first control point is level with the start,
// so the plane leaves horizontally and never snaps its nose on the first frame.
const P1 = { x: 36, y: 0 };
const P2 = { x: 84, y: -52 };
const along = (t: number) => ({
  x: 2 * (1 - t) * t * P1.x + t * t * P2.x,
  y: 2 * (1 - t) * t * P1.y + t * t * P2.y,
});
// The curve's tangent, so the nose points where it's heading.
const heading = (t: number) =>
  (Math.atan2(2 * (1 - t) * P1.y + 2 * t * (P2.y - P1.y), 2 * (1 - t) * P1.x + 2 * t * (P2.x - P1.x)) * 180) / Math.PI;

/** Paper plane icon that flies off while `flying` and comes home when it turns false (e.g. a failed submit). */
export function SendPlane({ flying, className }: { flying: boolean; className?: string }) {
  const reduceMotion = useReducedMotion();
  const t = useMotionValue(0);
  const x = useTransform(t, (v) => along(v).x);
  const y = useTransform(t, (v) => along(v).y);
  const rotate = useTransform(t, heading);
  // Shrinks a little as it gets further away, and fades over the last 45%.
  const scale = useTransform(t, [0, 1], [1, 0.75]);
  const opacity = useTransform(t, [0.55, 1], [1, 0]);

  useEffect(() => {
    if (!flying) {
      t.jump(0);
      return;
    }
    if (reduceMotion) return;
    const flight = animate(t, 1, { duration: FLIGHT, ease: FLIGHT_EASE });
    return () => flight.stop();
  }, [flying, reduceMotion, t]);

  return (
    <motion.svg
      aria-hidden
      viewBox="0 0 24 24"
      className={className ?? "size-5"}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ x, y, rotate, scale, opacity }}
    >
      <path d="M3.75 4.25 20.25 12 3.75 19.75 6.5 12Z" />
      <path d="M6.5 12h5.25" />
    </motion.svg>
  );
}
