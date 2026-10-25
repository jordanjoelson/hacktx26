"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { PostcardMode } from "@/lib/postcard";
import { Arrow } from "./arrow";
import { Framed } from "./framed";
import type { PostcardPhoto } from "./types";

/** Several photos in one spot. Arrows on the photo flip through them. */
export function PhotoStack({
  photos,
  onOpen,
  onChange,
  mode = "light",
  eager,
  fill,
}: {
  photos: PostcardPhoto[];
  onOpen: (photo: PostcardPhoto) => void;
  /** Called with the photo now on top after flipping. */
  onChange?: (photo: PostcardPhoto) => void;
  mode?: PostcardMode;
  eager?: boolean;
  /** Grow to fill the height of the card it's in (wider screens). */
  fill?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const photo = photos[index];
  if (!photo) return null;

  const go = (step: 1 | -1) => {
    const next = (index + step + photos.length) % photos.length;
    setIndex(next);
    onChange?.(photos[next]!);
  };
  const many = photos.length > 1;

  return (
    <div className={cn(fill && "flex h-full flex-col")}>
      <Framed photo={photo} onOpen={onOpen} mode={mode} eager={eager && index === 0} fill={fill} className={cn(fill && "flex-1")} animate>
        {many ? (
          <>
            <StackArrow side="left" onClick={() => go(-1)} />
            <StackArrow side="right" onClick={() => go(1)} />
          </>
        ) : null}
      </Framed>
      {many ? (
        <p className="mt-1 flex justify-end">
          <span className="text-xs text-[var(--pc-muted)]">
            {index + 1} / {photos.length}
          </span>
        </p>
      ) : null}
    </div>
  );
}

function StackArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const left = side === "left";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={left ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-[#1d1b2e] shadow-md transition hover:scale-105 active:scale-95 ${left ? "left-2.5" : "right-2.5"}`}
    >
      <Arrow direction={side} />
    </button>
  );
}
