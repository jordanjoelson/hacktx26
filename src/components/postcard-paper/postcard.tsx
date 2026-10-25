"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { RoughNotation, RoughNotationGroup } from "react-rough-notation";
import { Logo } from "@/components/logo";
import { labelEditor, labelFor, labelValue } from "@/components/postcard-labels";
import { PostcardListen } from "@/components/postcard-listen";
import { MarkupProvider, Rich, Text, type MarkupClasses } from "@/components/postcard-text";
import { cn } from "@/lib/cn";
import { resolveStyle, storyPhotoIndexes, type PostcardContent, type PostcardLabelKey, type PostcardMode } from "@/lib/postcard";
import { plainPostcardText, postcardNarration } from "@/lib/postcard-reading";
import "./postcard.css";
import { Framed, usePhotoTone } from "./framed";
import { PhotoStack } from "./photo-stack";
import { PhotoViewer } from "./photo-viewer";
import { Arrow } from "./arrow";
import { Rough } from "./rough";
import type { PostcardPhoto } from "./types";

const PAGES = 2;
const label = "text-[11px] font-semibold tracking-[0.2em] uppercase";
const body = "pc-body text-base leading-7 text-[var(--pc-body)] sm:text-[17px]";
const FALLBACK_TITLES = ["The week, in a few words.", "A little update.", "Before I forget.", "Another little moment."];

/** Markup and edit-field classes for the paper format. */
const MARKUP_CLASSES: MarkupClasses = {
  mark: "pc-highlight",
  pinkMark: "pc-pink",
  strike: "pc-strike",
  spoiler: "pc-spoiler",
  spoilerShown: "pc-spoiler-shown",
  editText: "pc-edit-text",
  editField: "pc-edit-field",
  emptyText: "pc-empty",
};

/** Colors for the shared read-aloud pill, which styles itself from these variables. */
const LISTEN_COLORS: Record<PostcardMode, React.CSSProperties> = {
  light: { "--bg": "#fffdf8", "--surface": "#f2ece3", "--surface-2": "#e7e0d5", "--text": "#1d1b2e", "--muted": "rgba(29, 27, 46, 0.6)", "--blue-text": "#0047ab" } as React.CSSProperties,
  dark: { "--bg": "#1e1d22", "--surface": "#2a2930", "--surface-2": "#36353d", "--text": "#f3f1ec", "--muted": "rgba(243, 241, 236, 0.6)", "--blue-text": "#8bb8e8" } as React.CSSProperties,
};

/** The dark style's colors, for owner controls (Edit, sample badge) shown on the page. */
const TOOLBAR_COLORS: Record<PostcardMode, React.CSSProperties> = {
  light: { "--bg": "#181819", "--surface": "#222224", "--surface-2": "#2c2c2f", "--text": "#f5f5f7", "--hover": "#36363a", "--muted": "rgba(29, 27, 46, 0.6)" } as React.CSSProperties,
  dark: { "--bg": "#181819", "--surface": "#222224", "--surface-2": "#2c2c2f", "--text": "#f5f5f7", "--hover": "#36363a", "--muted": "rgba(243, 241, 236, 0.6)" } as React.CSSProperties,
};

type Open = (photo: PostcardPhoto) => void;
type Edit = (apply: (draft: PostcardContent, value: string) => void) => ((value: string) => void) | undefined;

/** One story as the paper format lays it out. */
interface Story {
  index: number;
  title: string;
  /** Title is editable only when the postcard has its own titles (otherwise it's a stand-in). */
  titleEditable: boolean;
  body: string;
  photos: PostcardPhoto[];
}

/**
 * The paper format: two sheets on a soft gradient (or a dark one). Each story is a section washed in
 * its photo's mood color, photo and text side by side (stacked on a phone), and a few tiles are shaped
 * like what they hold (a bookmark, a quote, a calendar). With `onChange`, every piece of text, the
 * section labels included, can be tapped and edited in place.
 */
export function PostcardPaper({ content, onChange, controls }: {
  content: PostcardContent;
  onChange?: (next: PostcardContent) => void;
  controls?: ReactNode;
}) {
  const style = resolveStyle(content.style);
  const name = content.to.trim() || "you";
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [view, setView] = useState<PostcardPhoto | null>(null);

  const photo = (i: number): PostcardPhoto => ({
    id: String(i),
    index: i,
    src: content.photos[i]!.src,
    caption: plainPostcardText(content.photos[i]!.caption, name),
  });
  const used = new Set<number>();
  const stories: Story[] = content.stories.flatMap((story, index) => {
    const indexes = storyPhotoIndexes(content, index);
    indexes.forEach((i) => used.add(i));
    if (!story.trim() && !indexes.length && !onChange) return [];
    const own = content.storyTitles?.[index];
    return [{
      index,
      title: own || FALLBACK_TITLES[index] || "Another little moment.",
      titleEditable: own !== undefined,
      body: story,
      photos: indexes.map(photo),
    }];
  });
  // Photos not tied to a story join the last story's flip-through.
  const loose = content.photos.flatMap((p, i) => (p.src.trim() && !used.has(i) ? [photo(i)] : []));
  if (loose.length && stories.length) stories.at(-1)!.photos.push(...loose);

  // The first half of the stories go on page one; the rest, with the tiles and dates, on page two.
  const split = Math.max(1, Math.ceil(stories.length / 2));

  const edit: Edit = (apply) => {
    if (!onChange) return undefined;
    return (value: string) => {
      const draft = structuredClone(content);
      apply(draft, value);
      onChange(draft);
    };
  };

  /** A section label the sender can rename while editing (e.g. "Fun fact"). */
  const labelText = (key: PostcardLabelKey) => (
    <Text
      value={onChange ? labelValue(content, "paper", key) : labelFor(content, "paper", key)}
      name={name}
      single
      label={`${labelFor(content, "paper", key)} label`}
      placeholder={labelFor(content, "paper", key)}
      onChange={labelEditor(content, onChange, key)}
    />
  );

  function turn(step: 1 | -1) {
    setDir(step);
    setPage((p) => Math.min(PAGES - 1, Math.max(0, p + step)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  // The arrow-key listener is added once and always calls the latest turn().
  const turnRef = useRef(turn);
  useEffect(() => {
    turnRef.current = turn;
  });

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.target instanceof HTMLElement && event.target.closest("input, textarea, [contenteditable]")) return;
      if (event.key === "ArrowRight") turnRef.current(1);
      if (event.key === "ArrowLeft") turnRef.current(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shared = { content, name, mode: style.mode, photoSide: style.photoSide, edit, labelText, onOpen: setView, editing: !!onChange };

  return (
    <MarkupProvider classes={MARKUP_CLASSES}>
      <main
        className="pc-root min-h-svh px-3 pt-4 pb-12 sm:px-8 sm:pt-6 sm:pb-16"
        data-mode={style.mode}
        data-align={style.align}
        data-headings={style.boldHeadings ? "bold" : "regular"}
      >
        <div className="mx-auto mb-4 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 sm:mb-8">
          <Link href="/" className="flex items-center gap-2 font-serif text-2xl italic">
            <Logo className={cn("h-8 w-8 sm:h-9 sm:w-9", style.mode === "dark" && "invert")} /> Lately
          </Link>
          {controls ? (
            <div className="flex flex-wrap items-center justify-end gap-2" style={TOOLBAR_COLORS[style.mode]}>
              {controls}
            </div>
          ) : null}
        </div>

        <article className="pc-paper relative mx-auto w-full max-w-3xl overflow-hidden">
          <div key={page} className={cn("px-4 pt-7 pb-20 sm:px-12 sm:pt-12 sm:pb-24", dir === 1 ? "pc-page-next" : "pc-page-prev")}>
            <Delayed>
              {(show) => (
                <RoughNotationGroup show={show}>
                  {page === 0 ? (
                    <PageOne {...shared} stories={stories.slice(0, split)} />
                  ) : (
                    <PageTwo {...shared} stories={stories.slice(split)} offset={split} />
                  )}
                </RoughNotationGroup>
              )}
            </Delayed>
          </div>
          <PageNav page={page} onTurn={turn} />
        </article>

        {view ? <PhotoViewer photo={view} onClose={() => setView(null)} /> : null}
      </main>
    </MarkupProvider>
  );
}

interface Shared {
  content: PostcardContent;
  name: string;
  mode: PostcardMode;
  photoSide: "alternate" | "left" | "right";
  edit: Edit;
  labelText: (key: PostcardLabelKey) => ReactNode;
  onOpen: Open;
  editing: boolean;
}

/** Waits for fonts and the page-turn animation so hand-drawn underlines land in the right place. */
function Delayed({ children }: { children: (show: boolean) => React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    void document.fonts.ready.then(() => (timer = setTimeout(() => setShow(true), 500)));
    return () => clearTimeout(timer);
  }, []);
  return children(show);
}

/** Which side the photo sits on for the story at `position`. */
function flipped(photoSide: Shared["photoSide"], position: number): boolean {
  return photoSide === "right" || (photoSide === "alternate" && position % 2 === 1);
}

function PageOne({ stories, ...shared }: Shared & { stories: Story[] }) {
  const { content, name, mode, edit, labelText, editing } = shared;
  const narration = postcardNarration(content);
  return (
    <div className="space-y-3 sm:space-y-4">
      <header className="relative mb-8 sm:mb-10">
        <Sun className="pc-spin absolute top-0 right-0 w-11 sm:w-16" />
        {content.period || editing ? (
          <p className={cn(label, "pr-14 text-[var(--pc-muted)]")}>
            <Text value={content.period ?? ""} name={name} single label="Dates" placeholder="Add the dates"
              onChange={content.period !== undefined ? edit((d, v) => { d.period = v; }) : undefined} />
          </p>
        ) : null}
        <h1 className="pc-heading mt-3 pr-14 text-[2.1rem] leading-tight font-medium tracking-[-0.03em] sm:mt-4 sm:pr-16 sm:text-5xl">
          <Text value={content.to} name={name} single label="Recipient" onChange={edit((d, v) => { d.to = v; })} />
          &apos;s week,{" "}
          <span className="whitespace-nowrap">
            <RoughNotation type="underline" color={mode === "dark" ? "#8bb8e8" : "#0047ab"} strokeWidth={2.5} iterations={2} padding={2}>
              lately.
            </RoughNotation>
          </span>
        </h1>
        {content.intro || editing ? (
          <div className={cn("mt-4 whitespace-pre-line sm:mt-5", body)}>
            <Text value={content.intro ?? ""} name={name} label="Introduction" placeholder="Add a short introduction"
              onChange={content.intro !== undefined ? edit((d, v) => { d.intro = v; }) : undefined} />
          </div>
        ) : null}
        {narration ? (
          <div style={LISTEN_COLORS[mode]}>
            <PostcardListen key={narration} text={narration} />
          </div>
        ) : null}
        {content.opener?.trim() ? (
          <aside className="mt-5 border-l-2 border-[var(--pc-line-strong)] pl-4">
            <p className={cn(label, "text-[var(--pc-muted)]")}>{labelText("opener")}</p>
            <p className="pc-heading mt-1 text-lg leading-7 font-medium tracking-[-0.01em]">
              <Text value={content.opener} name={name} label="Opener" onChange={edit((d, v) => { d.opener = v; })} />
            </p>
          </aside>
        ) : null}
      </header>

      {stories.map((story, i) => (
        <StorySection key={story.index} story={story} flip={flipped(shared.photoSide, i)} eager={i === 0} {...shared} />
      ))}

      {content.tip.trim() || editing ? (
        <div className={cn("!mt-6 flex gap-1.5 px-1", body)}>
          <span className="shrink-0 font-semibold text-[var(--pc-ink)]">{labelText("tip")}</span>
          <div className="min-w-0 whitespace-pre-line">
            <Text value={content.tip} name={name} label="Postscript" onChange={edit((d, v) => { d.tip = v; })} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PageTwo({ stories, offset, ...shared }: Shared & { stories: Story[]; offset: number }) {
  const { content, name, edit, labelText, editing } = shared;
  const recs = content.recs.map((rec, index) => ({ ...rec, index })).filter((rec) => rec.title.trim() || rec.body.trim() || editing);
  const dates = content.dates.map((date, index) => ({ ...date, index })).filter((date) => date.label.trim() || date.note.trim() || editing);
  const funFact = content.funFact.trim() || editing;
  const tiles = recs.length + (funFact ? 1 : 0);
  return (
    <div className="space-y-3 sm:space-y-4">
      <h2 className="pc-heading mb-6 text-3xl leading-tight font-medium tracking-[-0.03em] sm:mb-8 sm:text-4xl">{labelText("later")}</h2>

      {tiles > 0 ? (
        <div className={cn("grid gap-3 sm:gap-4", tiles >= 3 ? "sm:grid-cols-3" : tiles === 2 ? "sm:grid-cols-2" : "")}>
          {recs.map((rec) => (
            <section key={rec.index} className={cn(tile, "bg-[#f9d34a] text-[#4a3200]")}>
              <span aria-hidden className="pc-ribbon absolute top-0 right-5 h-12 w-6 bg-[#e8467f]" />
              <p className={cn(label, "pr-8")}>{labelText("recs")}</p>
              <p className="pc-heading mt-2 pr-8 text-xl leading-7 font-medium tracking-[-0.02em] sm:text-2xl sm:leading-8">
                <Text value={rec.title} name={name} single label="Recommendation title" onChange={edit((d, v) => { d.recs[rec.index]!.title = v; })} />
              </p>
              <div className="pc-body mt-auto pt-4 text-sm leading-6 whitespace-pre-line">
                <Text value={rec.body} name={name} label="Recommendation" onChange={edit((d, v) => { d.recs[rec.index]!.body = v; })} />
              </div>
              {rec.url?.startsWith("https://") ? (
                <a href={rec.url} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-9 items-center gap-1 self-start rounded-full bg-[#4a3200]/10 px-3 text-xs font-semibold hover:bg-[#4a3200]/20">
                  {linkLabel(rec.url)} <span aria-hidden>↗</span>
                </a>
              ) : null}
            </section>
          ))}
          {funFact ? (
            <section className={cn(tile, "bg-[#cbb8f2] text-[#3b1d5c]")}>
              <p className={label}>{labelText("funFact")}</p>
              <span aria-hidden className="mt-1 font-serif text-6xl leading-none">“</span>
              <p className="pc-heading -mt-3 text-xl leading-7 font-medium tracking-[-0.02em]">
                <Text value={content.funFact} name={name} label="Fun fact" onChange={edit((d, v) => { d.funFact = v; })} />
              </p>
              <span aria-hidden className="mt-auto self-end font-serif text-6xl leading-[0.5]">”</span>
            </section>
          ) : null}
        </div>
      ) : null}

      {stories.map((story, i) => (
        <StorySection key={story.index} story={story} flip={flipped(shared.photoSide, i + offset)} {...shared} />
      ))}

      {dates.length ? (
        <Section mode={shared.mode}>
          <div className="flex items-center gap-3">
            <CalendarIcon />
            <p className={cn(label, "text-[var(--pc-muted)]")}>{labelText("dates")}</p>
          </div>
          <Dates dates={dates} name={name} edit={edit} editing={editing} />
        </Section>
      ) : null}

      <footer className="!mt-8 flex items-end justify-between gap-6 border-t border-[var(--pc-line)] px-1 pt-6 sm:!mt-10 sm:pt-8">
        <div>
          <p className="text-lg">{labelText("signoff")}</p>
          <p className="pc-heading mt-1 text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
            <Text value={content.from} name={name} single label="Sender" onChange={edit((d, v) => { d.from = v; })} />
          </p>
        </div>
        <EnvelopeIcon />
      </footer>
    </div>
  );
}

/** Roughly how many characters of body text sit beside a photo before the text column runs longer. */
const BESIDE_PHOTO = 420;

/**
 * Splits a story's paragraphs between the text column and the space under its photo: trailing
 * paragraphs move under the photo while the text column would still be at least as tall as the photo
 * plus what's under it, so a long story doesn't leave empty space below the picture.
 */
function splitForPhoto(paragraphs: string[]): [string[], string[]] {
  const length = (list: string[]) => list.reduce((sum, p) => sum + p.length, 0);
  const side = [...paragraphs];
  const tail: string[] = [];
  while (side.length > 1) {
    const last = side.at(-1)!.length;
    if (length(side) - last >= BESIDE_PHOTO + length(tail) + last) tail.unshift(side.pop()!);
    else break;
  }
  return [side, tail];
}

/** One story. One photo sits beside the text; several become a flip-through whose mood color follows the photo on top. */
function StorySection({ story, flip, eager, content, name, mode, edit, onOpen, editing }: Shared & { story: Story; flip: boolean; eager?: boolean }) {
  const [first] = story.photos;
  const [top, setTop] = useState(first);
  const shown = story.photos.find((p) => p.index === top?.index) ?? first;
  const media =
    story.photos.length > 1 ? (
      <PhotoStack photos={story.photos} onOpen={onOpen} onChange={setTop} mode={mode} eager={eager} />
    ) : first ? (
      <Framed photo={first} onOpen={onOpen} mode={mode} eager={eager} />
    ) : null;
  const rawCaption = shown ? content.photos[shown.index]?.caption ?? "" : "";
  const caption = shown && (rawCaption.trim() || editing) ? (
    <div className="mt-2 text-sm leading-5 whitespace-pre-line text-[var(--pc-muted)]">
      <Text value={rawCaption} name={name} label="Photo caption" placeholder="Add a caption"
        onChange={edit((d, v) => { d.photos[shown.index]!.caption = v; })} />
    </div>
  ) : null;

  // While editing, the whole story is one field; otherwise it's paragraphs, some moved under the photo.
  const paragraphs = story.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const [beside, under] = media && !editing ? splitForPhoto(paragraphs) : [paragraphs, []];
  const paragraphList = (list: string[]) =>
    list.map((text, i) => (
      <p key={i} className={cn(i > 0 && "mt-4", body)}>
        <Rich text={text} name={name} />
      </p>
    ));

  return (
    <Section mode={mode} photo={shown} story>
      <div className="pc-story" data-media={media ? "" : undefined} data-flip={flip ? "" : undefined}>
        {media ? (
          <div className="pc-media">
            {media}
            {caption}
          </div>
        ) : null}
        <div className="pc-text">
          <h3 className="pc-heading -mt-1 text-xl leading-7 font-medium tracking-[-0.02em] transition-colors duration-700 sm:text-2xl sm:leading-8" data-story-title="">
            <Text value={story.title} name={name} single label="Story heading"
              onChange={story.titleEditable ? edit((d, v) => { d.storyTitles![story.index] = v; }) : undefined} />
          </h3>
          <div className="mt-2">
            {editing ? (
              <div className={cn("whitespace-pre-line", body)}>
                <Text value={story.body} name={name} label="Story" onChange={edit((d, v) => { d.stories[story.index] = v; })} />
              </div>
            ) : (
              paragraphList(beside)
            )}
          </div>
        </div>
        {under.length ? <div className="pc-tail">{paragraphList(under)}</div> : null}
      </div>
    </Section>
  );
}

/**
 * A block washed in its photo's mood color (a neutral wash without a photo). Story titles inside take a
 * deep shade of the same color.
 */
function Section({ photo, mode, story, children }: { photo?: PostcardPhoto; mode: PostcardMode; story?: boolean; children: ReactNode }) {
  const tone = usePhotoTone(photo?.src, mode);
  return (
    <section
      className={cn("p-4 transition-colors duration-700 sm:p-7", story && "[&_[data-story-title]]:text-[var(--pc-title)]")}
      style={{ background: tone.wash, "--pc-title": tone.ink } as React.CSSProperties}
    >
      {children}
    </section>
  );
}

const tile = "relative flex min-h-44 flex-col p-5 sm:min-h-56";

/** Dates, each opening to its note. While editing, every field is open and editable. */
function Dates({ dates, name, edit, editing }: {
  dates: (PostcardContent["dates"][number] & { index: number })[];
  name: string;
  edit: Edit;
  editing: boolean;
}) {
  const [open, setOpen] = useState<number>();
  if (editing) {
    return (
      <ul className="mt-4 divide-y divide-[var(--pc-line)] border-y border-[var(--pc-line)]">
        {dates.map((item) => (
          <li key={item.index} className="space-y-1 py-3 text-[15px]">
            <div className="flex items-baseline justify-between gap-4">
              <Text value={item.label} name={name} single label="Occasion" onChange={edit((d, v) => { d.dates[item.index]!.label = v; })} />
              <span className="pc-heading shrink-0 text-lg font-medium">
                <Text value={item.when} name={name} single label="Date" onChange={edit((d, v) => { d.dates[item.index]!.when = v; })} />
              </span>
            </div>
            <div className="pc-body text-sm text-[var(--pc-muted)]">
              <Text value={item.note} name={name} label="Date note" onChange={edit((d, v) => { d.dates[item.index]!.note = v; })} />
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="mt-4 divide-y divide-[var(--pc-line)] border-y border-[var(--pc-line)]">
      {dates.map((item) => (
        <li key={item.index}>
          <button
            type="button"
            aria-expanded={open === item.index}
            onClick={() => setOpen(open === item.index ? undefined : item.index)}
            className="flex min-h-11 w-full items-center justify-between gap-4 py-2.5 text-left text-[15px]"
          >
            <span><Rich text={item.label} name={name} /></span>
            <span className="pc-heading shrink-0 text-lg font-medium tracking-[-0.02em]">{item.when}</span>
          </button>
          {open === item.index && item.note.trim() ? (
            <p className="pc-body pb-3 text-sm text-[var(--pc-muted)]"><Rich text={item.note} name={name} /></p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Labels a rec link by where it goes. */
function linkLabel(url: string): string {
  const { hostname, pathname } = new URL(url);
  if (hostname.endsWith("bookshop.org")) return "Find the book";
  if (hostname.endsWith("spotify.com")) return "Listen on Spotify";
  if (hostname.endsWith("justwatch.com")) return "Where to watch";
  if (hostname.includes("maps") || pathname.startsWith("/maps")) return "Open in Maps";
  return "Look it up";
}

/** Hand-drawn sun with hatching. */
function Sun({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className} style={{ "--dur": "80s" } as React.CSSProperties}>
      <Rough
        width={220}
        height={220}
        seed={3}
        className="h-auto w-full"
        draw={(rc) => [
          rc.circle(110, 110, 150, { fill: "#ffe14d", fillStyle: "solid", stroke: "none" }),
          rc.circle(110, 110, 150, { fill: "#ff7a2f", fillStyle: "hachure", hachureGap: 9, fillWeight: 2, stroke: "#1d1b2e", strokeWidth: 2, roughness: 2 }),
          ...Array.from({ length: 12 }, (_, i) => {
            const a = (i / 12) * Math.PI * 2;
            return rc.line(110 + Math.cos(a) * 88, 110 + Math.sin(a) * 88, 110 + Math.cos(a) * 106, 110 + Math.sin(a) * 106, { stroke: "#ff7a2f", strokeWidth: 3 });
          }),
        ]}
      />
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="34" height="36" viewBox="0 0 34 36" aria-hidden className="shrink-0">
      <rect x="1" y="5" width="32" height="30" rx="3" fill="#fff" stroke="#1d1b2e" strokeWidth="2" />
      <path d="M1 8a3 3 0 0 1 3-3h26a3 3 0 0 1 3 3v6H1z" fill="#e8467f" stroke="#1d1b2e" strokeWidth="2" />
      <rect x="8" y="1" width="3" height="8" rx="1.5" fill="#1d1b2e" />
      <rect x="23" y="1" width="3" height="8" rx="1.5" fill="#1d1b2e" />
      <circle cx="11" cy="22" r="2" fill="#1d1b2e" />
      <circle cx="17" cy="22" r="2" fill="#1d1b2e" />
      <circle cx="23" cy="22" r="2" fill="#e8467f" />
      <circle cx="11" cy="28" r="2" fill="#1d1b2e" />
    </svg>
  );
}

function EnvelopeIcon() {
  return (
    <svg width="52" height="38" viewBox="0 0 52 38" aria-hidden className="mb-2 shrink-0">
      <rect x="1.5" y="1.5" width="49" height="35" rx="3" fill="#0047ab" stroke="#0047ab" strokeWidth="2.5" />
      <path d="M2.5 3 26 21 49.5 3" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="26" cy="21" r="4.5" fill="#f9d34a" />
    </svg>
  );
}

function PageNav({ page, onTurn }: { page: number; onTurn: (step: 1 | -1) => void }) {
  return (
    <nav className="absolute inset-x-4 bottom-5 flex items-center justify-between text-sm sm:inset-x-12 sm:bottom-6">
      <button type="button" onClick={() => onTurn(-1)} disabled={page === 0} className="flex min-h-11 items-center gap-1.5 transition hover:-translate-x-1 disabled:invisible">
        <Arrow direction="left" />
        back
      </button>
      <span className="text-[var(--pc-muted)]">
        {page + 1} / {PAGES}
      </span>
      <button type="button" onClick={() => onTurn(1)} disabled={page === PAGES - 1} className="flex min-h-11 items-center gap-1.5 transition hover:translate-x-1 disabled:invisible">
        next page
        <Arrow direction="right" />
      </button>
    </nav>
  );
}
