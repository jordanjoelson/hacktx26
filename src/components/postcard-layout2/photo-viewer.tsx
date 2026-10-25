"use client";

import { useEffect } from "react";
import type { PostcardPhoto } from "@/components/postcard/types";

/** Full-screen view of one photo as a big tilted print. Escape or a click outside closes it. */
export function PhotoViewer({ photo, onClose }: { photo: PostcardPhoto; onClose: () => void }) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={photo.caption}
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1d1b2e]/75 p-6 backdrop-blur-sm"
    >
      <figure
        onClick={(event) => event.stopPropagation()}
        className="l2-pop relative w-full max-w-xl bg-white p-3 pb-0 shadow-2xl sm:p-4 sm:pb-0"
      >
        <img src={photo.src} alt={photo.caption} className="max-h-[70svh] w-full object-cover" style={{ objectPosition: photo.focus }} />
        <figcaption className="py-3 text-center font-serif text-2xl italic sm:py-4 sm:text-3xl">{photo.caption}</figcaption>
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute -top-4 -right-4 flex h-11 w-11 items-center justify-center rounded-full bg-[#1d1b2e] font-sans text-xl text-white shadow-lg transition hover:rotate-90"
        >
          ×
        </button>
      </figure>
    </div>
  );
}
