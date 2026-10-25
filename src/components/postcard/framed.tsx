"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { PostcardPhoto } from "./types";

/** A photo's mood color in three strengths. */
export interface Tone {
  /** Very light, for a section's background wash. */
  wash: string;
  /** Mid, for the block offset behind the photo. */
  offset: string;
  /** Deep, for a section title sitting on the wash. */
  ink: string;
}

const FALLBACK: Tone = { wash: "hsl(35 30% 94%)", offset: "hsl(35 25% 80%)", ink: "hsl(35 25% 22%)" };

function toHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}

/**
 * The photo's mood color: its average hue, with saturation lifted a little so dull photos still
 * get a recognizable color, in a light, mid, and deep strength. Works for any same-origin image,
 * so photos from the agent get matching colors automatically.
 */
export function usePhotoTone(src: string | undefined): Tone {
  const [tone, setTone] = useState(FALLBACK);

  useEffect(() => {
    if (!src) return;
    let live = true;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 8;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 8, 8);
      const data = ctx.getImageData(0, 0, 8, 8).data;
      let r = 0;
      let g = 0;
      let b = 0;
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]!;
        g += data[i + 1]!;
        b += data[i + 2]!;
      }
      const n = data.length / 4;
      const [h, s] = toHsl(r / n, g / n, b / n);
      const sat = Math.round(Math.min(0.7, Math.max(0.22, s * 1.3)) * 100);
      if (live) {
        setTone({
          wash: `hsl(${h.toFixed(0)} ${sat}% 93%)`,
          offset: `hsl(${h.toFixed(0)} ${sat}% 74%)`,
          ink: `hsl(${h.toFixed(0)} ${sat}% 22%)`,
        });
      }
    };
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);

  return tone;
}

/**
 * A photo with a block of its own color offset behind it. Tap to see it larger.
 * `children` render on top of the photo (e.g. flip-through arrows).
 */
export function Framed({
  photo,
  onOpen,
  animate,
  children,
}: {
  photo: PostcardPhoto;
  onOpen: (photo: PostcardPhoto) => void;
  /** Fade the image in when `photo` changes. */
  animate?: boolean;
  children?: React.ReactNode;
}) {
  const tone = usePhotoTone(photo.src);
  return (
    <div className="relative mr-3 mb-3">
      <span aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 transition-colors duration-700" style={{ background: tone.offset }} />
      <button
        type="button"
        onClick={() => onOpen(photo)}
        aria-label={`Open photo: ${photo.caption}`}
        className="group relative block aspect-[3/2] w-full overflow-hidden bg-neutral-200 outline-none focus-visible:ring-4 focus-visible:ring-[#0047ab]/30"
      >
        <img
          key={animate ? photo.id : undefined}
          src={photo.src}
          alt={photo.caption}
          className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]", animate && "pc-pop")}
          style={{ objectPosition: photo.focus }}
        />
      </button>
      {children}
    </div>
  );
}
