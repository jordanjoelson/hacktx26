"use client";

import { useState } from "react";
import { Framed } from "./framed";
import { Rough, roughArrow } from "./rough";
import type { PostcardPhoto } from "./types";

/** Several photos in one spot. Hand-drawn arrows on the photo flip through them. */
export function PhotoStack({
  photos,
  onOpen,
  onChange,
}: {
  photos: PostcardPhoto[];
  onOpen: (photo: PostcardPhoto) => void;
  /** Called with the photo now on top after flipping. */
  onChange?: (photo: PostcardPhoto) => void;
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
    <div>
      <Framed photo={photo} onOpen={onOpen} animate>
        {many ? (
          <>
            <StackArrow side="left" onClick={() => go(-1)} />
            <StackArrow side="right" onClick={() => go(1)} />
          </>
        ) : null}
      </Framed>
      {many ? (
        <p className="mt-3 flex justify-end">
          <span className="text-xs text-black/45">
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
      className={`absolute top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition hover:scale-110 active:scale-95 ${left ? "left-3" : "right-3"}`}
    >
      <Rough
        width={30}
        height={22}
        seed={left ? 7 : 11}
        className={left ? "-scale-x-100" : ""}
        draw={(rc) => roughArrow(rc, [[3, 13], [14, 8], [27, 11]], { stroke: "#0047ab", strokeWidth: 2.2 })}
      />
    </button>
  );
}
