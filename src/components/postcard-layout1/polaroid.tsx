"use client";

import { cn } from "@/lib/cn";
import { hash, seeded } from "./random";
import type { PostcardPhoto } from "./types";

const TAPES = ["yellow", "pink", "blue"] as const;

/**
 * A taped polaroid that opens larger when tapped. A photo's `note` sits
 * underneath it, inside the same box, so it never overlaps the text around it.
 */
export function Polaroid({
  photo,
  onOpen,
  className,
  tilt,
  style,
}: {
  photo: PostcardPhoto;
  onOpen: (photo: PostcardPhoto) => void;
  className?: string;
  /** Degrees; defaults to a stable random tilt per photo. */
  tilt?: number;
  style?: React.CSSProperties;
}) {
  const rand = seeded(hash(photo.id));
  const rotate = tilt ?? (rand() * 2 - 1) * 6;
  const tone = TAPES[Math.floor(rand() * TAPES.length)]!;
  const tapeTilt = (rand() * 2 - 1) * 10;

  return (
    <figure className={cn("relative", className)} style={style}>
      <button
        type="button"
        onClick={() => onOpen(photo)}
        aria-label={`Open photo: ${photo.caption}`}
        className="l1-polaroid relative block w-full bg-white p-2 pb-0 text-left outline-none focus-visible:ring-4 focus-visible:ring-[#0047ab]/30 sm:p-2.5 sm:pb-0"
        style={{ "--r": `${rotate}deg` } as React.CSSProperties}
      >
        <span
          aria-hidden
          data-tone={tone}
          className="l1-tape absolute -top-3 left-1/2 h-6 w-20 sm:w-24"
          style={{ transform: `translateX(-50%) rotate(${tapeTilt}deg)` }}
        />
        <img
          src={photo.src}
          alt={photo.caption}
          className="aspect-square w-full bg-neutral-200 object-cover"
          style={{ objectPosition: photo.focus }}
        />
        <span className="block truncate px-1 py-2 text-center font-serif text-lg italic">{photo.caption}</span>
      </button>
      {photo.note ? (
        <figcaption className="mt-3 text-center font-serif text-lg italic text-[#e8467f]">↑ {photo.note}</figcaption>
      ) : null}
    </figure>
  );
}
