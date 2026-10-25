import { cn } from "@/lib/cn";

/** A plain straight arrow in the current text color. */
export function Arrow({ direction, className }: { direction: "left" | "right"; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={cn("h-5 w-5 shrink-0", direction === "left" && "rotate-180", className)}
    >
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}
