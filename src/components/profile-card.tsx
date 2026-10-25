import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type Profile = {
  initials: string;
  name: string;
  handle: string;
  bio: string;
  stat: string;
  statLabel: string;
  week: number[];
};

const STAGGER = 40;

const CSS = `
.skeleton-bone {
  position: relative;
  overflow: hidden;
  background: color-mix(in oklab, var(--foreground) 7%, transparent);
}
[aria-busy="true"] .skeleton-bone::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, color-mix(in oklab, var(--foreground) 6%, transparent), transparent);
  translate: -100% 0;
  animation: skeleton-shimmer 1.8s cubic-bezier(0.4, 0, 0.2, 1) infinite;
}
@keyframes skeleton-shimmer {
  70%, 100% { translate: 100% 0; }
}
@media (prefers-reduced-motion: reduce) {
  [aria-busy="true"] .skeleton-bone::after { animation: none; display: none; }
}
`;

export function ProfileCard({
  profile,
  loading,
  className,
}: {
  profile: Profile;
  loading: boolean;
  className?: string;
}) {
  const loaded = !loading;
  return (
    <div
      aria-busy={loading}
      className={cn(
        "flex w-full flex-col gap-4 rounded-[32px] bg-white p-5 shadow-[0_1px_1px_rgb(0_0_0/0.04),0_10px_28px_rgb(0_0_0/0.07)]",
        className,
      )}
    >
      <style href="skeleton-loader" precedence="default">
        {CSS}
      </style>
      {loading && <span className="sr-only">Loading profile</span>}

      <Block
        index={0}
        loaded={loaded}
        skeleton={
          <div className="flex items-center gap-4">
            <div className="skeleton-bone size-12 shrink-0 rounded-full" />
            <div className="flex flex-col">
              <div className="flex h-6 items-center">
                <div className="skeleton-bone h-3.5 w-32 rounded-full" />
              </div>
              <div className="flex h-5 items-center">
                <div className="skeleton-bone h-3 w-24 rounded-full" />
              </div>
            </div>
          </div>
        }
      >
        <div className="flex items-center gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-black/10 text-base font-medium text-black">
            {profile.initials}
          </div>
          <div className="flex min-w-0 flex-col">
            <p className="truncate text-base leading-6 font-medium text-black">
              {profile.name}
            </p>
            <p className="truncate text-sm leading-5 text-[#6f6a66]">{profile.handle}</p>
          </div>
        </div>
      </Block>

      <Block
        index={1}
        loaded={loaded}
        skeleton={
          <div className="flex flex-col">
            <div className="flex h-6 items-center">
              <div className="skeleton-bone h-3.5 w-full rounded-full" />
            </div>
            <div className="flex h-6 items-center">
              <div className="skeleton-bone h-3.5 w-2/3 rounded-full" />
            </div>
          </div>
        }
      >
        <p className="line-clamp-2 h-12 text-sm leading-6 text-pretty text-black">
          {profile.bio}
        </p>
      </Block>

      <Block
        index={2}
        loaded={loaded}
        skeleton={<div className="skeleton-bone h-18 rounded-xl" />}
      >
        <div className="flex h-18 items-center justify-between rounded-xl bg-[#efeae2] px-4">
          <div className="flex flex-col">
            <span className="text-xl leading-7 font-medium text-black tabular-nums">
              {profile.stat}
            </span>
            <span className="text-[13px] leading-5 text-[#6f6a66]">{profile.statLabel}</span>
          </div>
          <div aria-hidden className="flex h-8 items-end gap-1.5">
            {profile.week.map((value, index) => (
              <span
                key={index}
                className={cn(
                  "w-2 rounded-full",
                  index === profile.week.length - 1 ? "bg-black" : "bg-black/20",
                )}
                style={{ height: `${Math.max(value, 0.15) * 100}%` }}
              />
            ))}
          </div>
        </div>
      </Block>
    </div>
  );
}

function Block({
  index,
  loaded,
  skeleton,
  children,
}: {
  index: number;
  loaded: boolean;
  skeleton: ReactNode;
  children: ReactNode;
}) {
  const delay = `${index * STAGGER}ms`;
  return (
    <div className="grid">
      <div
        aria-hidden
        className={cn(
          "col-start-1 row-start-1 transition-[opacity] ease-out",
          loaded ? "opacity-0 duration-150" : "duration-0",
        )}
        style={{ transitionDelay: loaded ? delay : "0ms" }}
      >
        {skeleton}
      </div>
      {loaded && (
        <div
          className="col-start-1 row-start-1 transition-[opacity,filter,translate] duration-[250ms] ease-[cubic-bezier(0.23,1,0.32,1)] starting:opacity-0 motion-safe:starting:translate-y-0.5 motion-safe:starting:blur-[4px]"
          style={{ transitionDelay: delay }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
