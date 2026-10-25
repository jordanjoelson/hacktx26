import Image from "next/image";
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import styles from "./lately-mascot.module.css";

export type LatelyMascotProps = {
  /** Size of the image container. Responsive width/height classes can override it. */
  size?: number | string;
  /** Idle blinks; `none` keeps the open-eye frame completely still. */
  animation?: "idle" | "none";
  /** Subtle vertical float. Set false to keep only the blink. */
  float?: boolean;
  /** Optional accessible description; decorative by default. */
  label?: string;
  className?: string;
};

/** Two fixed artwork frames; only the eyes change during a blink. */
export function LatelyMascot({
  size = 160,
  animation = "idle",
  float = true,
  label,
  className,
}: LatelyMascotProps) {
  return (
    <span
      className={cn(
        styles.mascot,
        animation === "idle" && float && styles.floating,
        className,
      )}
      style={
        {
          "--mascot-size": typeof size === "number" ? `${size}px` : size,
        } as CSSProperties
      }
    >
      <Image
        src="/mascot/lately.png"
        alt={label ?? ""}
        width={270}
        height={315}
        unoptimized
        loading="eager"
        className={styles.artwork}
      />
      {animation === "idle" && (
        <Image
          src="/mascot/lately-blink.png"
          alt=""
          aria-hidden="true"
          width={270}
          height={315}
          unoptimized
          loading="eager"
          className={cn(styles.artwork, styles.blink)}
        />
      )}
    </span>
  );
}
