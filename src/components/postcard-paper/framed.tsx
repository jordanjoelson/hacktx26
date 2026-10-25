"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import type { PostcardMode } from "@/lib/postcard";
import type { PostcardPhoto } from "./types";

/** A photo's mood color in three strengths, tuned for light or dark paper. */
export interface Tone {
  /** For a section's background wash. */
  wash: string;
  /** For the block offset behind the photo. */
  offset: string;
  /** For a section title sitting on the wash. */
  ink: string;
}

/** Hue and saturation pulled from a photo; strengths are derived per mode. */
interface Mood {
  hue: number;
  sat: number;
}

const NEUTRAL: Mood = { hue: 35, sat: 25 };

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

function toneFor({ hue, sat }: Mood, mode: PostcardMode): Tone {
  const h = hue.toFixed(0);
  return mode === "dark"
    ? { wash: `hsl(${h} ${Math.round(sat * 0.7)}% 17%)`, offset: `hsl(${h} ${sat}% 34%)`, ink: `hsl(${h} ${sat}% 82%)` }
    : { wash: `hsl(${h} ${sat}% 93%)`, offset: `hsl(${h} ${sat}% 74%)`, ink: `hsl(${h} ${sat}% 22%)` };
}

/**
 * The photo's mood color: its average hue, with saturation lifted a little so dull photos still get a
 * recognizable color, as a wash, offset, and ink for light or dark paper. Works for any image the
 * browser can read pixels from; others fall back to a warm neutral.
 */
export function usePhotoTone(src: string | undefined, mode: PostcardMode = "light"): Tone {
  const [mood, setMood] = useState(NEUTRAL);

  useEffect(() => {
    if (!src) return;
    let live = true;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
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
        const [hue, s] = toHsl(r / n, g / n, b / n);
        if (live) setMood({ hue, sat: Math.round(Math.min(0.7, Math.max(0.22, s * 1.3)) * 100) });
      } catch {
        // A photo from another site without CORS headers can't be read; keep the neutral tone.
      }
    };
    img.src = src;
    return () => {
      live = false;
    };
  }, [src]);

  return toneFor(mood, mode);
}

/**
 * A photo with a block of its own color offset behind it. Tap to see it larger.
 * `children` render on top of the photo (e.g. flip-through arrows).
 */
export function Framed({
  photo,
  onOpen,
  mode = "light",
  animate,
  eager,
  fill,
  className,
  children,
}: {
  photo: PostcardPhoto;
  onOpen: (photo: PostcardPhoto) => void;
  mode?: PostcardMode;
  /** Fade the image in when `photo` changes. */
  animate?: boolean;
  eager?: boolean;
  /** Grow to the height of the card it's in (wider screens); on a phone it keeps its shape. */
  fill?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const tone = usePhotoTone(photo.src, mode);
  return (
    <div className={cn("relative mr-3 mb-3", fill && "md:min-h-52", className)}>
      <span aria-hidden className="absolute inset-0 translate-x-3 translate-y-3 transition-colors duration-700" style={{ background: tone.offset }} />
      <button
        type="button"
        onClick={() => onOpen(photo)}
        aria-label={`Open photo: ${photo.caption || "a photo from the week"}`}
        className={cn(
          "group relative block w-full overflow-hidden bg-neutral-300 outline-none focus-visible:ring-4 focus-visible:ring-[#0047ab]/30",
          fill ? "aspect-[4/3] md:absolute md:inset-0 md:aspect-auto" : "aspect-[3/2]",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- photos can come from any host the agent stored */}
        <img
          key={animate ? photo.id : undefined}
          src={photo.src}
          alt={photo.caption || "A photo from the week"}
          loading={eager ? "eager" : "lazy"}
          className={cn("h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]", animate && "pc-pop")}
          style={{ objectPosition: photo.focus }}
        />
      </button>
      {children}
    </div>
  );
}
