"use client";

import { useState } from "react";
import { Rough, roughArrow } from "./rough";
import type { PostcardPhoto } from "@/components/postcard/types";

/**
 * Extra photos that didn't fit on the page, as a fanned stack of prints.
 * Hand-drawn arrows on the top print flip through them.
 */
export function PhotoStack({
  photos,
  onOpen,
}: {
  photos: PostcardPhoto[];
  onOpen: (photo: PostcardPhoto) => void;
}) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  if (photos.length === 0) return null;

  const at = (offset: number) => photos[(index + offset + photos.length) % photos.length]!;
  const top = at(0);

  function go(step: 1 | -1) {
    setDir(step);
    setIndex((i) => (i + step + photos.length) % photos.length);
  }

  return (
    <div className="relative mx-auto w-full max-w-60 pr-4 pb-4">
      {/* Prints peeking out from underneath. */}
      {[2, 1].map((depth) =>
        photos.length > depth ? (
          <div
            key={depth}
            aria-hidden
            className="absolute top-0 right-4 left-0 bg-white p-2 pb-10 border border-black/5 transition-transform duration-300"
            style={{ transform: `translate(${depth * 7}px, ${depth * 7}px)` }}
          >
            <img src={at(depth).src} alt="" className="aspect-square w-full object-cover opacity-90" style={{ objectPosition: at(depth).focus }} />
          </div>
        ) : null,
      )}

      <div
        key={top.id + index}
        className="l2-deal relative bg-white p-2 pb-0 border border-black/10"
        style={{ "--from-x": `${dir * 40}px`, "--from-r": `${dir * 8}deg` } as React.CSSProperties}
      >
        <button type="button" onClick={() => onOpen(top)} aria-label={`Open photo: ${top.caption}`} className="block w-full">
          <img src={top.src} alt={top.caption} className="aspect-square w-full object-cover" style={{ objectPosition: top.focus }} />
        </button>
        <p className="flex items-baseline justify-between px-1 py-2 font-serif text-lg italic leading-6">
          <span className="truncate">{top.caption}</span>
          <span className="shrink-0 pl-2 font-sans text-sm not-italic text-black/45">
            {index + 1}/{photos.length}
          </span>
        </p>

        <StackArrow side="left" onClick={() => go(-1)} />
        <StackArrow side="right" onClick={() => go(1)} />
      </div>
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
      className={`group absolute top-[38%] flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-110 active:scale-95 ${left ? "-left-6" : "-right-6"}`}
    >
      <Rough
        width={40}
        height={30}
        seed={left ? 7 : 11}
        className={`${left ? "-scale-x-100" : ""}`}
        draw={(rc) => roughArrow(rc, [[4, 18], [18, 12], [36, 15]], { stroke: "#0047ab", strokeWidth: 2.6 })}
      />
    </button>
  );
}
