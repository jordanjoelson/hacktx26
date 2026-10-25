"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { labelEditor, labelFor, labelValue } from "@/components/postcard-labels";
import { PostcardListen } from "@/components/postcard-listen";
import { Framed, usePhotoTone } from "@/components/postcard-paper/framed";
import { PhotoStack } from "@/components/postcard-paper/photo-stack";
import { PhotoViewer } from "@/components/postcard-paper/photo-viewer";
import "@/components/postcard-paper/postcard.css";
import type { PostcardPhoto } from "@/components/postcard-paper/types";
import { MarkupProvider, Rich, Text, type MarkupClasses } from "@/components/postcard-text";
import { cn } from "@/lib/cn";
import { resolveStyle, storyPhotoIndexes, type PostcardContent, type PostcardLabelKey, type PostcardMode } from "@/lib/postcard";
import { plainPostcardText, postcardNarration } from "@/lib/postcard-reading";

const label = "text-[11px] font-semibold tracking-[0.2em] uppercase";
const body = "pc-body text-[15px] leading-6 text-[var(--pc-body)] sm:text-base sm:leading-7";
const FALLBACK_TITLES = ["The week, in a few words.", "A little update.", "Before I forget.", "Another little moment."];

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

const LISTEN_COLORS: Record<PostcardMode, React.CSSProperties> = {
  light: { "--bg": "#fffdf8", "--surface": "#f2ece3", "--surface-2": "#e7e0d5", "--text": "#1d1b2e", "--muted": "rgba(29, 27, 46, 0.6)", "--blue-text": "#0047ab" } as React.CSSProperties,
  dark: { "--bg": "#1e1d22", "--surface": "#2a2930", "--surface-2": "#36353d", "--text": "#f3f1ec", "--muted": "rgba(243, 241, 236, 0.6)", "--blue-text": "#8bb8e8" } as React.CSSProperties,
};

const TOOLBAR_COLORS: Record<PostcardMode, React.CSSProperties> = {
  light: { "--bg": "#181819", "--surface": "#222224", "--surface-2": "#2c2c2f", "--text": "#f5f5f7", "--hover": "#36363a", "--muted": "rgba(29, 27, 46, 0.6)" } as React.CSSProperties,
  dark: { "--bg": "#181819", "--surface": "#222224", "--surface-2": "#2c2c2f", "--text": "#f5f5f7", "--hover": "#36363a", "--muted": "rgba(243, 241, 236, 0.6)" } as React.CSSProperties,
};

type Edit = (apply: (draft: PostcardContent, value: string) => void) => ((value: string) => void) | undefined;

/**
 * The grid format: the whole week on one screen as a grid of cards with even gutters. Stories are
 * cards washed in their photo's mood color; recommendations, the fun fact, dates, and the sign-off
 * are tiles shaped like what they hold. Stacks into one column on a phone. Editable like the others.
 */
export function PostcardGrid({ content, onChange, controls }: {
  content: PostcardContent;
  onChange?: (next: PostcardContent) => void;
  controls?: ReactNode;
}) {
  const style = resolveStyle(content.style);
  const mode = style.mode;
  const name = content.to.trim() || "you";
  const editing = !!onChange;
  const [view, setView] = useState<PostcardPhoto | null>(null);
  const narration = postcardNarration(content);

  const edit: Edit = (apply) => {
    if (!onChange) return undefined;
    return (value: string) => {
      const draft = structuredClone(content);
      apply(draft, value);
      onChange(draft);
    };
  };
  const labelText = (key: PostcardLabelKey) => (
    <Text value={onChange ? labelValue(content, "grid", key) : labelFor(content, "grid", key)} name={name} single
      label={`${labelFor(content, "grid", key)} label`} placeholder={labelFor(content, "grid", key)} onChange={labelEditor(content, onChange, key)} />
  );

  const photo = (i: number): PostcardPhoto => ({ id: String(i), index: i, src: content.photos[i]!.src, caption: plainPostcardText(content.photos[i]!.caption, name) });
  const used = new Set<number>();
  const stories = content.stories.flatMap((story, index) => {
    const indexes = storyPhotoIndexes(content, index);
    indexes.forEach((i) => used.add(i));
    if (!story.trim() && !indexes.length && !editing) return [];
    const own = content.storyTitles?.[index];
    return [{ index, body: story, title: own || FALLBACK_TITLES[index] || "Another little moment.", titleEditable: own !== undefined, photos: indexes.map(photo) }];
  });
  const loose = content.photos.flatMap((p, i) => (p.src.trim() && !used.has(i) ? [photo(i)] : []));
  if (loose.length && stories.length) stories.at(-1)!.photos.push(...loose);

  const recs = content.recs.map((rec, index) => ({ ...rec, index })).filter((rec) => rec.title.trim() || rec.body.trim() || editing);
  const dates = content.dates.map((date, index) => ({ ...date, index })).filter((date) => date.label.trim() || date.note.trim() || editing);
  const funFact = content.funFact.trim() || editing;
  const tiles = recs.length + (funFact ? 1 : 0);
  const hasOpener = !!content.opener?.trim();

  // Rows always add up to the full width (12 columns), so nothing leaves a gap. Stories go two to a
  // row (7 + 5, then 5 + 7); an odd one out gets a whole row with its photo beside the text.
  const storySpan = (i: number) => {
    if (i === stories.length - 1 && i % 2 === 0) return SPAN[12];
    const row = Math.floor(i / 2);
    return (row % 2 === 0) === (i % 2 === 0) ? SPAN[7] : SPAN[5];
  };
  // Tiles fill rows of up to three, sharing each row evenly.
  const tileSpan = (i: number) => {
    const lastRowStart = Math.floor((tiles - 1) / 3) * 3;
    const inRow = i >= lastRowStart ? tiles - lastRowStart : 3;
    return SPAN[(12 / inRow) as 4 | 6 | 12];
  };
  const photoRight = (i: number) => style.photoSide === "right" || (style.photoSide === "alternate" && i % 2 === 1);

  return (
    <MarkupProvider classes={MARKUP_CLASSES}>
      <main className="pc-root min-h-svh px-3 pt-4 pb-12 sm:px-8 sm:pt-6 sm:pb-16" data-mode={mode} data-align={style.align}
        data-headings={style.boldHeadings ? "bold" : "regular"}>
        <div className="mx-auto mb-4 flex w-full max-w-5xl flex-wrap items-center justify-between gap-3 sm:mb-6">
          <Link href="/" className="flex items-center gap-2 font-serif text-2xl italic">
            <Logo className={cn("h-8 w-8 sm:h-9 sm:w-9", mode === "dark" && "invert")} /> Lately
          </Link>
          {controls ? <div className="flex flex-wrap items-center justify-end gap-2" style={TOOLBAR_COLORS[mode]}>{controls}</div> : null}
        </div>

        <div className="mx-auto grid max-w-5xl gap-3 sm:gap-4 md:grid-cols-12">
          {/* Hero */}
          <section className={cn("pc-paper flex flex-col p-5 sm:p-7", hasOpener ? SPAN[7] : SPAN[12])}>
            {content.period || editing ? (
              <p className={cn(label, "text-[var(--pc-muted)]")}>
                <Text value={content.period ?? ""} name={name} single label="Dates" placeholder="Add the dates"
                  onChange={content.period !== undefined ? edit((d, v) => { d.period = v; }) : undefined} />
              </p>
            ) : null}
            <h1 className="pc-heading mt-3 text-[2rem] leading-tight font-medium tracking-[-0.03em] whitespace-pre-line sm:text-[2.6rem]">
              <Text value={content.title || `${name}'s week, lately.`} name={name} label="Title"
                onChange={content.title !== undefined ? edit((d, v) => { d.title = v; }) : undefined} />
            </h1>
            {content.intro || editing ? (
              <div className={cn("mt-3 whitespace-pre-line", body)}>
                <Text value={content.intro ?? ""} name={name} label="Introduction" placeholder="Add a short introduction"
                  onChange={content.intro !== undefined ? edit((d, v) => { d.intro = v; }) : undefined} />
              </div>
            ) : null}
            <div className="mt-auto" style={LISTEN_COLORS[mode]}>
              {narration ? <PostcardListen key={narration} text={narration} /> : null}
            </div>
          </section>

          {/* Opener, or the first story when there isn't one */}
          {hasOpener ? (
            <section className={cn("flex flex-col justify-between bg-[#bcd3f5] p-5 text-[#132a4d] sm:p-7", SPAN[5])}>
              <p className={label}>{labelText("opener")}</p>
              <p className="pc-heading mt-6 text-xl leading-8 font-medium tracking-[-0.015em] sm:text-2xl">
                <Text value={content.opener!} name={name} label="Opener" onChange={edit((d, v) => { d.opener = v; })} />
              </p>
            </section>
          ) : null}

          {stories.map((story, i) => (
            <StoryCard key={story.index} story={story} beside={storySpan(i) === SPAN[12]} photoRight={photoRight(i)} className={storySpan(i)}
              content={content} name={name} mode={mode} edit={edit} editing={editing} onOpen={setView} eager={i === 0} />
          ))}

          {recs.map((rec, i) => (
            <section key={rec.index} className={cn("relative flex min-h-48 flex-col bg-[#f9d34a] p-5 text-[#4a3200] sm:p-6", tileSpan(i))}>
              <span aria-hidden className="pc-ribbon absolute top-0 right-5 h-12 w-6 bg-[#e8467f]" />
              <p className={cn(label, "pr-8")}>{labelText("recs")}</p>
              <p className="pc-heading mt-2 pr-8 text-xl leading-7 font-medium tracking-[-0.02em]">
                <Text value={rec.title} name={name} single label="Recommendation title" onChange={edit((d, v) => { d.recs[rec.index]!.title = v; })} />
              </p>
              <div className="pc-body mt-auto pt-4 text-sm leading-6 whitespace-pre-line">
                <Text value={rec.body} name={name} label="Recommendation" onChange={edit((d, v) => { d.recs[rec.index]!.body = v; })} />
              </div>
              {rec.url?.startsWith("https://") ? (
                <a href={rec.url} target="_blank" rel="noopener noreferrer"
                  className="mt-3 inline-flex min-h-9 items-center gap-1 self-start rounded-full bg-[#4a3200]/10 px-3 text-xs font-semibold hover:bg-[#4a3200]/20">
                  Look it up <span aria-hidden>↗</span>
                </a>
              ) : null}
            </section>
          ))}
          {funFact ? (
            <section className={cn("flex min-h-48 flex-col bg-[#cbb8f2] p-5 text-[#3b1d5c] sm:p-6", tileSpan(recs.length))}>
              <p className={label}>{labelText("funFact")}</p>
              <span aria-hidden className="mt-1 font-serif text-6xl leading-none">“</span>
              <p className="pc-heading -mt-3 text-xl leading-7 font-medium tracking-[-0.02em]">
                <Text value={content.funFact} name={name} label="Fun fact" onChange={edit((d, v) => { d.funFact = v; })} />
              </p>
              <span aria-hidden className="mt-auto self-end font-serif text-6xl leading-[0.5]">”</span>
            </section>
          ) : null}

          {dates.length ? (
            <section className={cn("pc-paper p-5 sm:p-7", SPAN[7])}>
              <p className={cn(label, "text-[var(--pc-muted)]")}>{labelText("dates")}</p>
              <ul className="mt-4 space-y-3">
                {dates.map((date, i) => (
                  <li key={date.index} className="flex items-start gap-3">
                    <span className="flex min-w-16 shrink-0 justify-center rounded-lg px-2 py-1 text-sm font-semibold"
                      style={{ background: CHIPS[i % CHIPS.length]!.bg, color: CHIPS[i % CHIPS.length]!.ink }}>
                      <Text value={date.when} name={name} single label="Date" onChange={edit((d, v) => { d.dates[date.index]!.when = v; })} />
                    </span>
                    <div className="min-w-0">
                      <p className="pc-heading font-medium">
                        <Text value={date.label} name={name} single label="Occasion" onChange={edit((d, v) => { d.dates[date.index]!.label = v; })} />
                      </p>
                      {date.note.trim() || editing ? (
                        <div className="pc-body text-sm leading-6 text-[var(--pc-muted)]">
                          <Text value={date.note} name={name} label="Date note" onChange={edit((d, v) => { d.dates[date.index]!.note = v; })} />
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className={cn("flex min-h-56 flex-col bg-[#0047ab] p-5 text-white sm:p-7", dates.length ? SPAN[5] : SPAN[12])}>
            {content.tip.trim() || editing ? (
              <div className="pc-body text-sm leading-6 text-white/85">
                <span className="font-semibold text-white">{labelText("tip")}</span>{" "}
                <Text value={content.tip} name={name} label="Postscript" onChange={edit((d, v) => { d.tip = v; })} />
              </div>
            ) : null}
            <p className="mt-auto pt-6 text-lg">{labelText("signoff")}</p>
            <p className="pc-heading mt-1 text-4xl font-medium tracking-[-0.02em] sm:text-5xl">
              <Text value={content.from} name={name} single label="Sender" onChange={edit((d, v) => { d.from = v; })} />
            </p>
          </section>
        </div>

        {view ? <PhotoViewer photo={view} onClose={() => setView(null)} /> : null}
      </main>
    </MarkupProvider>
  );
}

const CHIPS = [
  { bg: "#dbe9fb", ink: "#1b4a85" },
  { bg: "#ffe1d6", ink: "#8a3415" },
  { bg: "#d6f5e8", ink: "#16613f" },
  { bg: "#fff1c7", ink: "#7a5600" },
  { bg: "#ece3ff", ink: "#4b2d8a" },
];

/** Full class names, so Tailwind can see them. */
const SPAN = {
  4: "md:col-span-4",
  5: "md:col-span-5",
  6: "md:col-span-6",
  7: "md:col-span-7",
  12: "md:col-span-12",
} as const;

/**
 * A story card washed in its photo's mood color. In a shared row the photo sits on top and grows to
 * fill the card, so the story with less text doesn't leave empty space; with a whole row to itself
 * (beside) the photo sits beside the text.
 */
function StoryCard({ story, beside, photoRight, className, content, name, mode, edit, editing, onOpen, eager }: {
  story: { index: number; body: string; title: string; titleEditable: boolean; photos: PostcardPhoto[] };
  beside: boolean;
  photoRight: boolean;
  className: string;
  content: PostcardContent;
  name: string;
  mode: PostcardMode;
  edit: Edit;
  editing: boolean;
  onOpen: (photo: PostcardPhoto) => void;
  eager?: boolean;
}) {
  const [first] = story.photos;
  const [top, setTop] = useState(first);
  const shown = story.photos.find((p) => p.index === top?.index) ?? first;
  const tone = usePhotoTone(shown?.src, mode);
  const media =
    story.photos.length > 1 ? (
      <PhotoStack photos={story.photos} onOpen={onOpen} onChange={setTop} mode={mode} eager={eager} fill />
    ) : first ? (
      <Framed photo={first} onOpen={onOpen} mode={mode} eager={eager} fill className="h-full" />
    ) : null;
  const paragraphs = story.body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <section
      className={cn(
        "flex flex-col gap-5 p-5 transition-colors duration-700 sm:p-6",
        beside && media && "md:grid md:grid-cols-2 md:gap-7",
        className,
      )}
      style={{ background: tone.wash }}
    >
      {media ? <div className={cn("flex min-h-0 flex-col md:flex-1", beside && photoRight && "md:order-2")}>{media}</div> : null}
      <div className="min-w-0">
        <h2 className="pc-heading text-xl leading-7 font-medium tracking-[-0.02em] transition-colors duration-700" style={{ color: tone.ink }}>
          <Text value={story.title} name={name} single label="Story heading"
            onChange={story.titleEditable ? edit((d, v) => { d.storyTitles![story.index] = v; }) : undefined} />
        </h2>
        <div className="mt-2">
          {editing ? (
            <div className={cn("whitespace-pre-line", body)}>
              <Text value={story.body} name={name} label="Story" onChange={edit((d, v) => { d.stories[story.index] = v; })} />
            </div>
          ) : (
            paragraphs.map((text, i) => (
              <p key={i} className={cn(i > 0 && "mt-3", body)}>
                <Rich text={text} name={name} />
              </p>
            ))
          )}
        </div>
        {shown && editing ? (
          <div className="mt-3 text-sm text-[var(--pc-muted)]">
            <Text value={content.photos[shown.index]?.caption ?? ""} name={name} label="Photo caption" placeholder="Add a caption"
              onChange={edit((d, v) => { d.photos[shown.index]!.caption = v; })} />
          </div>
        ) : null}
      </div>
    </section>
  );
}
