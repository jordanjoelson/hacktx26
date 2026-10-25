import { cn } from "@/lib/cn";

/**
 * A sheet of paper. The paper is drawn on a background layer, so children
 * (photos, the stamp) can hang off the edges.
 */
export function NotebookPaper({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("relative", className)}>
      <div aria-hidden className="l1-paper-shadow absolute inset-0">
        <div className="l1-paper absolute inset-0 rounded-sm" />
      </div>
      <div className="relative">{children}</div>
    </div>
  );
}
