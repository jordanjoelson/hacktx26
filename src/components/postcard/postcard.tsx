"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RoughNotation, RoughNotationGroup } from "react-rough-notation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";
import "./postcard.css";
import { Framed, usePhotoTone } from "./framed";
import { MarkedText } from "./marked-text";
import { PhotoStack } from "./photo-stack";
import { PhotoViewer } from "./photo-viewer";
import { Rough, roughArrow } from "./rough";
import type { PostcardData, PostcardPhoto } from "./types";

/** Photos 0–4 are placed on the pages; the rest go in the flip-through stack. */
const PLACED = 5;
const PAGES = 2;
const label = "text-[11px] font-semibold tracking-[0.2em] uppercase";
const body = "text-[17px] leading-7 text-black/75";

type Open = (photo: PostcardPhoto) => void;

/**
 * The weekly postcard as two sheets of paper. Each sheet is a column of rows
 * with the same spacing: photos sit square in a two-column grid beside their
 * text, and a few tiles are shaped like what they hold (a bookmark, a quote,
 * a ticket, a calendar). Everything is optional to interact with.
 */
export function Postcard({ card }: { card: PostcardData }) {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [view, setView] = useState<PostcardPhoto | null>(null);

  const turn = useCallback((step: 1 | -1) => {
    setDir(step);
    setPage((p) => Math.min(PAGES - 1, Math.max(0, p + step)));
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") turn(1);
      if (event.key === "ArrowLeft") turn(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [turn]);

  return (
    <main className="pc-root min-h-svh px-4 pt-20 pb-16 sm:px-8 sm:pt-24">
      <Link href="/" className="fixed top-4 left-4 z-30 flex items-center gap-2 font-serif text-2xl italic sm:top-6 sm:left-6">
        <Logo className="h-9 w-9" /> Lately
      </Link>

      <article className="pc-paper relative mx-auto w-full max-w-3xl overflow-hidden">
        <div key={page} className={cn("px-5 pt-8 pb-24 sm:px-12 sm:pt-12", dir === 1 ? "pc-page-next" : "pc-page-prev")}>
          <Delayed>
            {(show) => (
              <RoughNotationGroup show={show}>
                {page === 0 ? <PageOne card={card} onOpen={setView} /> : <PageTwo card={card} onOpen={setView} />}
              </RoughNotationGroup>
            )}
          </Delayed>
        </div>
        <PageNav page={page} onTurn={turn} />
      </article>

      {view ? <PhotoViewer photo={view} onClose={() => setView(null)} /> : null}
    </main>
  );
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

function PageOne({ card, onOpen }: { card: PostcardData; onOpen: Open }) {
  const [thursday, dinner] = card.photos;
  const extra = card.photos.slice(PLACED);
  // The dinner section takes its mood color from whichever photo is on top of its flip-through.
  const [stackTop, setStackTop] = useState(dinner);
  return (
    <div className="space-y-4">
      <header className="relative mb-10">
        <Sun className="pc-spin absolute top-0 right-0 w-14 sm:w-16" />
        <p className={cn(label, "text-black/45")}>{card.dates}</p>
        <h1 className="mt-4 pr-16 text-4xl leading-tight font-medium tracking-[-0.03em] sm:text-5xl">
          {card.to}&apos;s week,{" "}
          <span>
            <RoughNotation type="underline" color="#0047ab" strokeWidth={2.5} iterations={2} padding={2}>
              lately.
            </RoughNotation>
          </span>
        </h1>
        <p className={cn("mt-5", body)}>
          <MarkedText text={card.notes[0] ?? ""} />
        </p>
        {card.tags?.length ? (
          <ul className="mt-5 flex flex-wrap gap-1.5">
            {card.tags.map((tag, i) => (
              <li key={tag} className={cn("border px-2 py-0.5 text-xs", i === 0 ? "border-[#1d1b2e] bg-[#1d1b2e] text-white" : "border-black/15")}>
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      {thursday ? (
        <Row photo={thursday} title={thursday.caption} media={<Framed photo={thursday} onOpen={onOpen} />}>
          <Paragraphs texts={card.notes.slice(1, 2)} />
        </Row>
      ) : null}

      {/* The dinner leads a flip-through of the week's other photos. */}
      {dinner ? (
        <Row photo={stackTop ?? dinner} title={dinner.caption} flip media={<PhotoStack photos={[dinner, ...extra]} onOpen={onOpen} onChange={setStackTop} />}>
          <Paragraphs texts={[...card.notes.slice(2), card.tip]} />
        </Row>
      ) : null}
    </div>
  );
}

function Paragraphs({ texts }: { texts: string[] }) {
  return texts.map((text, i) => (
    <p key={i} className={cn(i > 0 && "mt-4", body)}>
      <MarkedText text={text} />
    </p>
  ));
}

function PageTwo({ card, onOpen }: { card: PostcardData; onOpen: Open }) {
  const [, , home, leftOut, walk] = card.photos;
  return (
    <div className="space-y-4">
      <h2 className="mb-8 text-3xl leading-tight font-medium tracking-[-0.03em] sm:text-4xl">
        Saved for <span>later</span>
      </h2>

      <div className="grid gap-4 sm:grid-cols-3">
        {card.recs.map((rec) => (
          <RecTile key={rec.title} rec={rec} />
        ))}
        <QuoteTile text={card.funFact} />
        <TicketTile ticket={card.ticket} />
      </div>

      {home ? (
        <Row photo={home} title={home.caption} media={<Framed photo={home} onOpen={onOpen} />}>
          <Paragraphs texts={card.later.slice(0, 1)} />
        </Row>
      ) : null}

      {leftOut ? (
        <Row photo={leftOut} title={leftOut.caption} flip media={<Framed photo={leftOut} onOpen={onOpen} />}>
          <Paragraphs texts={card.later.slice(1)} />
        </Row>
      ) : null}

      <Row photo={walk} media={walk ? <Framed photo={walk} onOpen={onOpen} /> : null}>
        <Dates saved={card.saved} />
      </Row>

      <footer className="!mt-10 flex items-end justify-between gap-6 border-t border-black/10 pt-8">
        <div>
          <p className="text-lg">{card.signoff}</p>
          <p className="mt-1 text-5xl font-medium tracking-[-0.02em]">{card.from}</p>
        </div>
        <EnvelopeIcon />
      </footer>
    </div>
  );
}

/**
 * A photo and its text side by side in two equal columns, top-aligned.
 * The photo's caption titles the text, so each row reads as one short story.
 * `flip` puts the photo on the right.
 */
function Row({
  photo,
  media,
  title,
  flip,
  children,
}: {
  /** The photo whose mood color tints this section. */
  photo?: PostcardPhoto;
  media: React.ReactNode;
  title?: string;
  flip?: boolean;
  children: React.ReactNode;
}) {
  const tone = usePhotoTone(photo?.src);
  return (
    <section
      className="grid items-start gap-6 p-5 transition-colors duration-700 sm:grid-cols-2 sm:gap-8 sm:p-7"
      style={{ background: tone.wash }}
    >
      {media ? <div className={flip ? "sm:order-2" : undefined}>{media}</div> : null}
      <div>
        {title ? (
          <h3
            className="-mt-1 text-2xl leading-8 font-medium tracking-[-0.02em] transition-colors duration-700 first-letter:uppercase"
            style={{ color: tone.ink }}
          >
            {title}
          </h3>
        ) : null}
        <div className={title ? "mt-2" : undefined}>{children}</div>
      </div>
    </section>
  );
}

const tile = "relative flex min-h-56 flex-col p-5";

/** A bookmarked recommendation. */
function RecTile({ rec }: { rec: PostcardData["recs"][number] }) {
  return (
    <section className={cn(tile, "bg-[#f9d34a] text-[#4a3200]")}>
      <span aria-hidden className="pc-ribbon absolute top-0 right-5 h-12 w-6 bg-[#e8467f]" />
      <p className={label}>{rec.kind}</p>
      <p className="mt-2 text-2xl font-medium tracking-[-0.02em]">{rec.title}</p>
      <p className="mt-auto pt-4 text-sm leading-6">
        <MarkedText text={rec.body} />
      </p>
    </section>
  );
}

/** A fact set between big quote marks. */
function QuoteTile({ text }: { text: string }) {
  return (
    <section className={cn(tile, "bg-[#cbb8f2] text-[#3b1d5c]")}>
      <p className={label}>Fun fact</p>
      <span aria-hidden className="mt-1 font-serif text-6xl leading-none">“</span>
      <p className="-mt-3 text-xl leading-7 font-medium tracking-[-0.02em]">{text}</p>
      <span aria-hidden className="mt-auto self-end font-serif text-6xl leading-[0.5]">”</span>
    </section>
  );
}

/** The tile itself is cut like a ticket stub. */
function TicketTile({ ticket }: { ticket: PostcardData["ticket"] }) {
  return (
    <section className="pc-ticket flex min-h-56 bg-[#ff9cc8] text-[#4a0f2c]">
      <div className="flex flex-1 flex-col p-5 pl-7">
        <p className={label}>Admit one</p>
        <p className="mt-2 text-2xl font-medium tracking-[-0.02em]">{ticket.title}</p>
        <p className="mt-auto pt-4 text-sm leading-6">{ticket.line}</p>
      </div>
      <div className="flex w-12 shrink-0 items-center justify-center border-l-2 border-dashed border-[#4a0f2c]/30 pr-2">
        <p className={cn(label, "rotate-90 whitespace-nowrap")}>{ticket.when}</p>
      </div>
    </section>
  );
}

/** Dates under a little calendar page. */
function Dates({ saved }: { saved: PostcardData["saved"] }) {
  const [open, setOpen] = useState<string>();
  return (
    <section>
      <div className="flex items-center gap-3">
        <CalendarIcon />
        <p className={cn(label, "text-black/45")}>Dates worth remembering</p>
      </div>
      <ul className="mt-4 divide-y divide-black/10 border-y border-black/10">
        {saved.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              aria-expanded={open === item.label}
              onClick={() => setOpen(open === item.label ? undefined : item.label)}
              className="flex w-full items-baseline justify-between gap-4 py-2.5 text-left text-[15px]"
            >
              <span>{item.label}</span>
              <span className="text-lg font-medium tracking-[-0.02em]">{item.when}</span>
            </button>
            {open === item.label ? <p className="pb-3 text-sm text-black/55">{item.note}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
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
            return rc.line(110 + Math.cos(a) * 88, 110 + Math.sin(a) * 88, 110 + Math.cos(a) * 106, 110 + Math.sin(a) * 106, { stroke: "#1d1b2e", strokeWidth: 3 });
          }),
        ]}
      />
    </div>
  );
}

function CalendarIcon() {
  return (
    <svg width="34" height="36" viewBox="0 0 34 36" aria-hidden>
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
    <nav className="absolute inset-x-5 bottom-6 flex items-center justify-between text-sm sm:inset-x-12">
      <button type="button" onClick={() => onTurn(-1)} disabled={page === 0} className="flex items-center gap-1 transition hover:-translate-x-1 disabled:invisible">
        <Rough width={36} height={20} seed={31} className="-scale-x-100" draw={(rc) => roughArrow(rc, [[2, 12], [16, 7], [33, 10]], { strokeWidth: 1.8 })} />
        back
      </button>
      <span className="text-black/45">
        {page + 1} / {PAGES}
      </span>
      <button type="button" onClick={() => onTurn(1)} disabled={page === PAGES - 1} className="flex items-center gap-1 transition hover:translate-x-1 disabled:invisible">
        next page
        <Rough width={36} height={20} seed={37} draw={(rc) => roughArrow(rc, [[2, 12], [16, 7], [33, 10]], { strokeWidth: 1.8 })} />
      </button>
    </nav>
  );
}
