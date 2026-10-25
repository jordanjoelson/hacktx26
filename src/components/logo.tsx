import { LatelyMascot } from "./lately-mascot";

/** @deprecated Use LatelyMascot for new placements. */
export function Logo({ className }: { className?: string }) {
  return <LatelyMascot className={className} />;
}
