"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { ProfileCard, type Profile } from "@/components/profile-card";
import type { PostcardContent } from "@/lib/postcard";

const tile = "relative min-w-0 rounded-2xl";
// Crop for each photo slot, in order.
const PHOTO_POSITIONS = ["object-left", "object-center", "object-[32%_center]", "object-[20%_center]"];

function profileFor(name: string, from: string): Profile {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "•";
  return {
    initials,
    name,
    handle: `From ${from}`,
    bio: `The short version of the week, for ${name}. Walking, one dinner, and the part you would have asked about.`,
    stat: "4",
    statLabel: "Notes this week",
    week: [0.35, 0.5, 0.3, 0.65, 0.55, 0.8, 1],
  };
}

/**
 * One person's postcard. Read-only by default; pass `onChange` to make every text field editable in place.
 */
export function Postcard({
  content,
  onChange,
  className = "",
}: {
  content: PostcardContent;
  onChange?: (next: PostcardContent) => void;
  className?: string;
}) {
  const editable = Boolean(onChange);
  const name = content.to.trim() || "them";
  const from = content.from.trim() || "you";
  const [photo, setPhoto] = useState<string | null>(null);
  const [openDate, setOpenDate] = useState(0);
  const [view, setView] = useState<{ src: string; caption: string } | null>(null);

  const date = content.dates[openDate] ?? content.dates[0];

  /** Returns a setter for one field, or undefined when read-only. */
  function edit(apply: (draft: PostcardContent, value: string) => void) {
    if (!onChange) return undefined;
    return (value: string) => {
      const draft = structuredClone(content);
      apply(draft, value);
      onChange(draft);
    };
  }

  function pickPhoto(file: File | undefined) {
    if (!file) return;
    setPhoto((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  const photoProps = (i: number) => ({
    caption: content.photos[i]?.caption ?? "",
    src: content.photos[i]?.src ?? "",
    imgClassName: PHOTO_POSITIONS[i],
    name,
    onOpen: setView,
    onCaption: edit((draft, value) => {
      draft.photos[i]!.caption = value;
    }),
  });

  return (
    <main className={`min-h-svh bg-[#efeae2] px-2 py-3 sm:px-4 sm:py-6 ${className}`}>
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-6">
        <section className="col-span-2 flex min-h-48 flex-col justify-between rounded-2xl bg-[#0047ab] p-5 text-white sm:col-span-6 sm:min-h-56">
          <div className="text-sm">
            From{" "}
            <Text value={content.from} name={name} single onChange={edit((d, v) => void (d.from = v))} />
          </div>
          <div>
            <label htmlFor="person" className="text-sm text-white/80">
              To
            </label>
            {editable ? (
              <input
                id="person"
                value={content.to}
                onChange={(event) => edit((d, v) => void (d.to = v))!(event.target.value)}
                className="w-full bg-transparent text-5xl text-white outline-none sm:text-6xl"
              />
            ) : (
              <p id="person" className="text-5xl sm:text-6xl">
                {name}
              </p>
            )}
          </div>
        </section>

        <ProfileCard profile={profileFor(name, from)} loading={false} className="col-span-2 sm:col-span-6" />

        <section className={`${tile} col-span-2 bg-white p-4 text-base leading-7 sm:col-span-4 sm:p-5 sm:text-lg sm:leading-8`}>
          <Text value={content.stories[0] ?? ""} name={name} onChange={edit((d, v) => void (d.stories[0] = v))} />
        </section>
        <Photo {...photoProps(0)} className="col-span-2 aspect-[4/3] sm:col-span-2 sm:col-start-5 sm:aspect-[3/4]" />

        <Photo {...photoProps(1)} className="col-span-2 h-52 sm:col-span-6 sm:h-64" />

        <Rec
          rec={content.recs[0]}
          name={name}
          onTitle={edit((d, v) => void (d.recs[0]!.title = v))}
          onBody={edit((d, v) => void (d.recs[0]!.body = v))}
          className="col-span-2 sm:col-span-4"
          titleClassName="text-3xl sm:text-4xl"
          bodyClassName="text-base leading-7 sm:text-lg sm:leading-8"
        />
        <div
          className={`${tile} col-span-2 flex min-h-44 flex-col items-center justify-center overflow-hidden border-2 border-dashed border-black/25 bg-[#f6f1e7] text-center sm:col-span-2`}
        >
          {photo ? (
            <button
              type="button"
              aria-label={`Expand You and ${name}`}
              onClick={() => setView({ src: photo, caption: `You and ${name}` })}
              className="absolute inset-0"
            >
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </button>
          ) : (
            <span className="px-4 text-4xl leading-none">Together</span>
          )}
          {editable ? (
            // shortcut: the picked photo is a local preview only, never uploaded; save it once media storage exists.
            <label
              className={`z-10 cursor-pointer px-4 text-xs ${photo ? "absolute top-3 left-3 text-left text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]" : "mt-3 text-neutral-600"}`}
            >
              You and {name}
              <span className="mt-1 block">Apple Photos, or send your own</span>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => pickPhoto(event.target.files?.[0])}
              />
            </label>
          ) : (
            <span className="mt-3 px-4 text-xs text-neutral-600">You and {name}</span>
          )}
        </div>

        <section className={`${tile} col-span-2 bg-white px-4 py-3 text-lg sm:col-span-6 sm:px-5`}>
          <Text value={content.tip} name={name} onChange={edit((d, v) => void (d.tip = v))} />
        </section>

        <section className={`${tile} col-span-2 bg-[#fff04a] p-4 sm:col-span-4 sm:p-5`}>
          <p className="text-xs">Fun fact</p>
          <p className="mt-3 font-serif text-3xl italic leading-tight sm:text-4xl">
            <Text value={content.funFact} name={name} onChange={edit((d, v) => void (d.funFact = v))} />
          </p>
        </section>
        <Rec
          rec={content.recs[1]}
          name={name}
          onTitle={edit((d, v) => void (d.recs[1]!.title = v))}
          onBody={edit((d, v) => void (d.recs[1]!.body = v))}
          className="col-span-2 sm:col-span-2"
          titleClassName="text-2xl"
          bodyClassName="text-base leading-7"
        />

        <Photo {...photoProps(2)} className="col-span-2 aspect-[4/3] sm:col-span-2 sm:aspect-[3/4]" />
        <section className={`${tile} col-span-2 bg-white p-4 text-base leading-7 sm:col-span-4 sm:p-5 sm:text-lg sm:leading-8`}>
          <Text value={content.stories[1] ?? ""} name={name} onChange={edit((d, v) => void (d.stories[1] = v))} />
        </section>

        <Photo {...photoProps(3)} className="col-span-2 h-48 sm:col-span-4 sm:h-auto" />
        <section className={`${tile} col-span-2 bg-white p-4 text-base leading-7 sm:col-span-2 sm:p-5 sm:text-lg sm:leading-8`}>
          <Text value={content.stories[2] ?? ""} name={name} onChange={edit((d, v) => void (d.stories[2] = v))} />
        </section>

        {date ? (
          <>
          <section className={`${tile} col-span-2 flex min-h-36 items-center justify-center bg-white sm:col-span-2`}>
            <span className="absolute top-3 left-4 text-xs">Saved</span>
            <p className="text-4xl">
              <Mark>{date?.when}</Mark>
            </p>
          </section>

          <section className={`${tile} col-span-2 bg-white p-4 sm:col-span-4`}>
            <ul>
              {content.dates.map((item, i) => {
                if (editable) {
                  return (
                    <li key={i} className="py-1.5 text-sm">
                      <div className="flex items-baseline justify-between gap-4">
                        <Text value={item.label} name={name} single onChange={edit((d, v) => void (d.dates[i]!.label = v))} />
                        <span className="text-xs">
                          <Text value={item.when} name={name} single onChange={edit((d, v) => void (d.dates[i]!.when = v))} />
                        </span>
                      </div>
                      <p className="pt-1 text-xs leading-5">
                        <Text value={item.note} name={name} onChange={edit((d, v) => void (d.dates[i]!.note = v))} />
                      </p>
                    </li>
                  );
                }
                const open = i === openDate;
                return (
                  <li key={i}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenDate(i)}
                      className="flex w-full items-baseline justify-between gap-4 py-1.5 text-left text-sm"
                    >
                      <span>{rich(item.label, name)}</span>
                      <span className="text-xs">{item.when}</span>
                    </button>
                    {open ? <p className="pb-2 text-xs leading-5">{rich(item.note, name)}</p> : null}
                  </li>
                );
              })}
            </ul>
          </section>
          </>
        ) : null}
      </div>
      {view ? <Viewer src={view.src} caption={view.caption} onClose={() => setView(null)} /> : null}
    </main>
  );
}

const MARKUP = /(==.+?==|\+\+.+?\+\+|~~.+?~~)/g;

/** Renders ==highlight==, ++pink++, ~~cut~~, and {name}. */
function rich(text: string, name: string): ReactNode {
  return text
    .replaceAll("{name}", name)
    .split(MARKUP)
    .map((part, i) => {
      if (i % 2 === 0) return part;
      const inner = part.slice(2, -2);
      if (part.startsWith("==")) return <Mark key={i}>{inner}</Mark>;
      if (part.startsWith("++")) return <Mark key={i} tone="pink">{inner}</Mark>;
      return <Cut key={i}>{inner}</Cut>;
    });
}

/** Rich text; when `onChange` is set, tap it to edit the raw markup in place. */
function Text({
  value,
  name,
  onChange,
  single = false,
}: {
  value: string;
  name: string;
  onChange?: (value: string) => void;
  single?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [editing, value]);

  if (!onChange) return <>{rich(value, name)}</>;

  const done = () => setEditing(false);
  const fieldClass = "w-full resize-none rounded bg-transparent outline-none ring-2 ring-[#0047ab]/40";

  if (editing) {
    return single ? (
      <input
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={done}
        onKeyDown={(event) => (event.key === "Enter" || event.key === "Escape") && done()}
        className={`${fieldClass} inline-block w-auto min-w-0`}
      />
    ) : (
      <textarea
        ref={area}
        autoFocus
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={done}
        onKeyDown={(event) => event.key === "Escape" && done()}
        className={`${fieldClass} block overflow-hidden`}
      />
    );
  }

  return (
    <button
      type="button"
      aria-label={`Edit: ${value.replaceAll("{name}", name)}`}
      onClick={() => setEditing(true)}
      className={`${single ? "inline" : "block w-full"} cursor-text rounded text-left outline-1 outline-current/25 outline-dashed hover:outline-current/60`}
    >
      {value.trim() ? rich(value, name) : <span className="opacity-50">Tap to write</span>}
    </button>
  );
}

function Rec({
  rec,
  name,
  onTitle,
  onBody,
  className,
  titleClassName,
  bodyClassName,
}: {
  rec: PostcardContent["recs"][number] | undefined;
  name: string;
  onTitle?: (value: string) => void;
  onBody?: (value: string) => void;
  className: string;
  titleClassName: string;
  bodyClassName: string;
}) {
  if (!rec) return null;
  return (
    <section className={`${tile} bg-white p-4 sm:p-5 ${className}`}>
      <p className="text-xs">Rec</p>
      <h2 className={`mt-2 ${titleClassName}`}>
        <Text value={rec.title} name={name} single onChange={onTitle} />
      </h2>
      <div className={`mt-3 ${bodyClassName}`}>
        <Text value={rec.body} name={name} onChange={onBody} />
      </div>
    </section>
  );
}

function Mark({ children, tone = "yellow" }: { children: ReactNode; tone?: "yellow" | "pink" }) {
  const bg = tone === "pink" ? "bg-[#ffb7d5]" : "bg-[#fff04a]";
  return <mark className={`${bg} box-decoration-clone px-1 text-inherit [box-decoration-break:clone]`}>{children}</mark>;
}

function Cut({ children }: { children: ReactNode }) {
  return (
    <s className="text-black decoration-black decoration-[3px] [text-decoration-skip-ink:none]">{children}</s>
  );
}

function Photo({
  caption,
  src,
  name,
  onOpen,
  onCaption,
  className = "",
  imgClassName = "",
}: {
  caption: string;
  src: string;
  name: string;
  onOpen: (photo: { src: string; caption: string }) => void;
  onCaption?: (value: string) => void;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <div className={`${tile} h-full min-h-40 overflow-hidden bg-neutral-200 ${className}`}>
      <button
        type="button"
        aria-label={`Expand ${caption}`}
        onClick={() => onOpen({ src, caption })}
        className="absolute inset-0 cursor-pointer"
      >
        <img src={src} alt="" className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`} />
      </button>
      <span
        className={`absolute top-3 right-3 left-3 text-xs text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)] ${onCaption ? "" : "pointer-events-none"}`}
      >
        <Text value={caption} name={name} single onChange={onCaption} />
      </span>
    </div>
  );
}

function Viewer({ src, caption, onClose }: { src: string; caption: string; onClose: () => void }) {
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
      aria-label={caption}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-10"
      onClick={onClose}
    >
      <div className="relative max-h-[80svh] w-full max-w-lg" onClick={(event) => event.stopPropagation()}>
        <img src={src} alt={caption} className="max-h-[80svh] w-full rounded-2xl object-contain" />
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center text-3xl leading-none text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]"
        >
          ×
        </button>
        <p className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/70 to-transparent px-5 pt-12 pb-4 text-base text-white">
          {caption}
        </p>
      </div>
    </div>
  );
}
