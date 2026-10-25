"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState, type ReactNode } from "react";

/**
 * Class names each postcard format uses for inline markup and in-place editing,
 * so every format shares one renderer and one editor.
 */
export interface MarkupClasses {
  mark: string;
  pinkMark: string;
  strike?: string;
  spoiler: string;
  spoilerShown: string;
  editText: string;
  editField: string;
  emptyText: string;
}

const MarkupContext = createContext<MarkupClasses | null>(null);

export function MarkupProvider({ classes, children }: { classes: MarkupClasses; children: ReactNode }) {
  return <MarkupContext.Provider value={classes}>{children}</MarkupContext.Provider>;
}

function useClasses(): MarkupClasses {
  const classes = useContext(MarkupContext);
  if (!classes) throw new Error("Postcard text needs a MarkupProvider");
  return classes;
}

const MARKUP = /(\*\*.+?\*\*|==.+?==|\+\+.+?\+\+|~~.+?~~|\|\|.+?\|\|)/g;

/**
 * Renders postcard markup: **bold**, ==highlight==, ++pink++, ~~cut~~, ||spoiler||, and {name}.
 * `interactive` is false inside the edit buttons, where a spoiler can't be its own button; it shows revealed there.
 */
export function Rich({ text, name, interactive = true }: { text: string; name: string; interactive?: boolean }) {
  const classes = useClasses();
  return (
    <>
      {text.replaceAll("{name}", name).split(MARKUP).map((part, i) => {
        if (i % 2 === 0) return part;
        const inner = part.slice(2, -2);
        if (part.startsWith("**")) return <strong key={i}>{inner}</strong>;
        if (part.startsWith("~~")) return <s key={i} className={classes.strike}>{inner}</s>;
        if (part.startsWith("||")) {
          return interactive ? <Spoiler key={i}>{inner}</Spoiler> : <span key={i} className={classes.spoilerShown}>{inner}</span>;
        }
        return <mark className={part.startsWith("++") ? classes.pinkMark : classes.mark} key={i}>{inner}</mark>;
      })}
    </>
  );
}

/**
 * A piece of postcard text. Read-only without `onChange`; with it, tapping the text turns it into a
 * field (single line or auto-growing textarea) that edits the raw markup.
 */
export function Text({ value, name, onChange, single = false, label, placeholder = "Write a little something…" }: {
  value: string;
  name: string;
  onChange?: (value: string) => void;
  single?: boolean;
  label: string;
  placeholder?: string;
}) {
  const classes = useClasses();
  const [editing, setEditing] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (!area.current) return;
    area.current.style.height = "auto";
    area.current.style.height = `${area.current.scrollHeight}px`;
  }, [editing, value]);
  if (!onChange) return <Rich text={value} name={name} />;
  if (editing) {
    const common = {
      autoFocus: true, value, "aria-label": label, className: classes.editField, "data-postcard-field": "",
      onFocus: (event: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => { lastField = event.currentTarget; },
      // Tapping the formatting toolbar shouldn't close the field it's formatting.
      onBlur: (event: React.FocusEvent) => {
        if (event.relatedTarget instanceof HTMLElement && event.relatedTarget.closest("[data-postcard-toolbar]")) return;
        setEditing(false);
      },
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
      onKeyDown: (event: React.KeyboardEvent) => {
        if (event.key === "Escape" || (single && event.key === "Enter")) setEditing(false);
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "b") {
          event.preventDefault();
          toggleWrap(event.currentTarget as HTMLInputElement | HTMLTextAreaElement, "**");
        }
      },
    };
    return single ? <input {...common} /> : <textarea {...common} ref={area} />;
  }
  return (
    <button type="button" className={classes.editText} aria-label={`Edit ${label.toLowerCase()}`} onClick={() => setEditing(true)}>
      {value.trim() ? <Rich text={value} name={name} interactive={false} /> : <span className={classes.emptyText}>{placeholder}</span>}
    </button>
  );
}

/** Discord-style spoiler: hidden until tapped. */
function Spoiler({ children }: { children: ReactNode }) {
  const classes = useClasses();
  const [shown, setShown] = useState(false);
  if (shown) return <span className={classes.spoilerShown}>{children}</span>;
  return (
    <button type="button" className={classes.spoiler} onClick={() => setShown(true)} aria-label="Spoiler, tap to reveal">
      <span aria-hidden="true">{children}</span>
    </button>
  );
}

/**
 * Wraps the field's selection in `mark` (e.g. "**" for bold), or unwraps it if it's already wrapped.
 * Sets the value through the native setter and fires an input event so React's onChange sees it.
 */
export function toggleWrap(field: HTMLInputElement | HTMLTextAreaElement, mark: string) {
  const { value, selectionStart, selectionEnd } = field;
  let start = selectionStart ?? value.length;
  let end = selectionEnd ?? value.length;
  // With nothing selected, act on the word under the cursor.
  if (start === end) {
    while (start > 0 && /\S/.test(value[start - 1]!)) start--;
    while (end < value.length && /\S/.test(value[end]!)) end++;
  }
  const selected = value.slice(start, end);
  const outside = value.slice(start - mark.length, start) === mark && value.slice(end, end + mark.length) === mark;
  const inside = selected.startsWith(mark) && selected.endsWith(mark) && selected.length >= mark.length * 2;
  let next: string;
  let caretStart: number;
  let caretEnd: number;
  if (outside) {
    next = value.slice(0, start - mark.length) + selected + value.slice(end + mark.length);
    caretStart = start - mark.length;
    caretEnd = end - mark.length;
  } else if (inside) {
    const unwrapped = selected.slice(mark.length, -mark.length);
    next = value.slice(0, start) + unwrapped + value.slice(end);
    caretStart = start;
    caretEnd = start + unwrapped.length;
  } else {
    next = value.slice(0, start) + mark + selected + mark + value.slice(end);
    caretStart = start + mark.length;
    caretEnd = end + mark.length;
  }
  const proto = field instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
  Object.getOwnPropertyDescriptor(proto, "value")?.set?.call(field, next);
  field.dispatchEvent(new Event("input", { bubbles: true }));
  requestAnimationFrame(() => field.setSelectionRange(caretStart, caretEnd));
}

/** The field most recently focused for editing; the toolbar formats it even if a tap moved focus. */
let lastField: HTMLInputElement | HTMLTextAreaElement | null = null;

/** The text field being edited, if any. */
function activeField(): HTMLInputElement | HTMLTextAreaElement | null {
  const el = document.activeElement;
  if (el instanceof HTMLElement && el.hasAttribute("data-postcard-field")) return el as HTMLInputElement | HTMLTextAreaElement;
  return lastField?.isConnected ? lastField : null;
}

/**
 * Floating formatting buttons shown while editing: bold and highlight act on the selected words
 * (or the word under the cursor) in whichever field is open. Pressing a button doesn't take focus
 * from the field, so the field stays open.
 */
export function FormatToolbar({ className = "" }: { className?: string }) {
  const keepFocus = (event: React.PointerEvent | React.MouseEvent) => event.preventDefault();
  const apply = (mark: string) => {
    const field = activeField();
    if (!field) return;
    field.focus();
    toggleWrap(field, mark);
  };
  const button = "flex min-h-10 min-w-10 items-center justify-center rounded-full px-3 text-sm transition hover:bg-white/15";
  return (
    <div role="toolbar" data-postcard-toolbar="" aria-label="Text formatting" className={`flex items-center gap-1 rounded-full bg-[#2c2c2f] p-1 text-white shadow-lg ring-1 ring-white/10 ${className}`}>
      <button type="button" className={`${button} font-bold`} aria-label="Bold (Ctrl+B)" title="Bold (Ctrl+B)" onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => apply("**")}>
        B
      </button>
      <button type="button" className={button} aria-label="Highlight" title="Highlight" onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => apply("==")}>
        <span className="rounded bg-[#ffe08a] px-1 text-[#1d1b2e]">ab</span>
      </button>
      <button type="button" className={button} aria-label="Pink highlight" title="Pink highlight" onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => apply("++")}>
        <span className="rounded bg-[#ff9cc8] px-1 text-[#1d1b2e]">ab</span>
      </button>
      <button type="button" className={`${button} line-through`} aria-label="Cross out" title="Cross out" onPointerDown={keepFocus} onMouseDown={keepFocus} onClick={() => apply("~~")}>
        ab
      </button>
      <span className="hidden px-2 text-xs text-white/55 sm:inline">Tap text to edit</span>
    </div>
  );
}
