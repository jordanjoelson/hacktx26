"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Postcard } from "@/components/postcard";
import { PostcardGrid } from "@/components/postcard-grid";
import { PostcardPaper } from "@/components/postcard-paper/postcard";
import { cn } from "@/lib/cn";
import { resolveStyle, type PostcardContent, type PostcardStyle } from "@/lib/postcard";

/**
 * Shows a postcard in the format its sender picked: blog (a single-column feed), paper (sheets of
 * paper with mood-colored sections), or grid (a card grid), each in light or dark. All three can be
 * edited in place when `onChange` is passed.
 */
export function PostcardView({
  content,
  onChange,
  className,
  controls,
}: {
  content: PostcardContent;
  onChange?: (next: PostcardContent) => void;
  className?: string;
  controls?: ReactNode;
}) {
  const { format } = resolveStyle(content.style);
  if (format === "paper") return <PostcardPaper content={content} onChange={onChange} controls={controls} />;
  if (format === "grid") return <PostcardGrid content={content} onChange={onChange} controls={controls} />;
  return <Postcard content={content} onChange={onChange} className={className} controls={controls} />;
}

type Option<T> = { value: T; label: string; hint?: string };

const FORMATS: Option<NonNullable<PostcardStyle["format"]>>[] = [
  { value: "blog", label: "Blog", hint: "One column, like a post" },
  { value: "paper", label: "Paper", hint: "Sheets of paper, two pages" },
  { value: "grid", label: "Grid", hint: "Everything at a glance" },
];
const MODES: Option<NonNullable<PostcardStyle["mode"]>>[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];
const SIDES: Option<NonNullable<PostcardStyle["photoSide"]>>[] = [
  { value: "alternate", label: "Alternate" },
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
];

/** A row of mutually exclusive choices. */
function Segmented<T extends string>({ label, options, value, onChange, disabled }: {
  label: string;
  options: Option<T>[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div className={cn(disabled && "opacity-45")}>
      <p id={id} className="mb-1.5 text-xs font-semibold tracking-wide text-white/60 uppercase">{label}</p>
      <div role="radiogroup" aria-labelledby={id} className="grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-white/8 p-1">
        {options.map((option) => (
          <button
            key={String(option.value)}
            type="button"
            role="radio"
            aria-checked={value === option.value}
            disabled={disabled}
            title={option.hint}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-10 rounded-lg px-2 text-sm transition disabled:cursor-not-allowed",
              value === option.value ? "bg-white font-semibold text-[#1d1b2e]" : "text-white/80 hover:bg-white/10",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// Picking a format swaps the whole postcard component, and this control with it, so whether the
// panel is open lives out here; that keeps it open while you try formats one after another.
let panelOpen = false;

/**
 * The Style button and its panel: format, light/dark, and photo side.
 * Changes apply to `content.style` right away; section names are renamed by tapping them while editing.
 */
export function StyleControl({ content, onChange }: { content: PostcardContent; onChange: (next: PostcardContent) => void }) {
  const [open, setOpenState] = useState(() => panelOpen);
  const setOpen = (next: boolean) => {
    panelOpen = next;
    setOpenState(next);
  };
  const panel = useRef<HTMLDivElement>(null);
  const style = resolveStyle(content.style);
  const set = (patch: Partial<PostcardStyle>) => onChange({ ...content, style: { ...content.style, ...patch } });
  const renamed = Object.values(content.style?.labels ?? {}).some((v) => v?.trim());

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (!panel.current?.contains(target) && !target.closest("[data-style-toggle]")) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        data-style-toggle=""
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex h-[34px] items-center gap-1.5 rounded-full bg-[#2c2c2f] px-4 text-sm font-semibold whitespace-nowrap text-[#f5f5f7] hover:bg-[#36363a]"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
          <circle cx="10" cy="10" r="7" />
          <path d="M10 3a7 7 0 0 0 0 14c1.2 0 1.6-1 1-1.8-.7-.9-.2-2.2 1-2.2h1.5A3.5 3.5 0 0 0 17 9.5 7 7 0 0 0 10 3Z" />
          <circle cx="6.5" cy="9" r="1" fill="currentColor" />
          <circle cx="9.5" cy="6.2" r="1" fill="currentColor" />
        </svg>
        Style
      </button>
      {/* Portaled to <body>: the top bar's backdrop blur would otherwise trap this fixed panel inside the bar. */}
      {open && typeof document !== "undefined" ? createPortal(
        <div
          ref={panel}
          role="dialog"
          aria-label="Postcard style"
          className="fixed inset-x-2 bottom-2 z-[70] max-h-[80svh] space-y-4 overflow-y-auto rounded-2xl bg-[#222224] p-4 text-white shadow-2xl ring-1 ring-white/10 sm:inset-x-auto sm:top-16 sm:right-4 sm:bottom-auto sm:w-[22rem]"
        >
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold">Style</p>
            <button type="button" onClick={() => setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-xl hover:bg-white/10" aria-label="Close style">
              ×
            </button>
          </div>
          <Segmented label="Format" options={FORMATS} value={style.format} onChange={(format) => set({ format })} />
          <p className="-mt-2 text-xs text-white/50">{FORMATS.find((f) => f.value === style.format)?.hint}</p>
          <Segmented label="Mode" options={MODES} value={style.mode} onChange={(mode) => set({ mode })} />
          <Segmented label="Photos" options={SIDES} value={style.photoSide} onChange={(photoSide) => set({ photoSide })} disabled={style.format === "blog"} />
          {style.format === "blog" ? <p className="-mt-2 text-xs text-white/50">The blog keeps photos above each story.</p> : null}
          {style.format === "grid" ? <p className="-mt-2 text-xs text-white/50">In Grid, this applies to wide stories on larger screens.</p> : null}
          <div className="rounded-xl bg-white/5 p-3 text-xs leading-5 text-white/65">
            Rename sections like &ldquo;Fun fact&rdquo; by tapping them while editing. Select words and use <b className="text-white">B</b> to bold them.
          </div>
          <div className="flex flex-wrap gap-2">
            {renamed ? (
              <button type="button" onClick={() => set({ labels: undefined })} className="min-h-10 rounded-full bg-white/10 px-4 text-sm hover:bg-white/15">
                Reset section names
              </button>
            ) : null}
            <button type="button" onClick={() => onChange({ ...content, style: {} })} className="min-h-10 rounded-full bg-white/10 px-4 text-sm hover:bg-white/15">
              Reset style
            </button>
          </div>
        </div>
      , document.body) : null}
    </>
  );
}
