"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RoughNotation, RoughNotationGroup } from "react-rough-notation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";
import "./layout1.css";
import { MarkedText } from "./marked-text";
import { NotebookPaper } from "./notebook-paper";
import { PhotoStack } from "./photo-stack";
import { PhotoViewer } from "./photo-viewer";
import { Polaroid } from "./polaroid";
import { Rough, roughArrow } from "./rough";
import type { PostcardData, PostcardPhoto } from "@/components/postcard/types";

// layout1: the scrapbook version (paper sheet, tilted polaroids, two pages).
/** Photos 0–1 go on page 1, 2–4 on page 2; the rest go in the flip-through stack. */
const PLACED = 5;
const PAGES = 2;
const overhangLeft = { marginLeft: "calc(-1 * (var(--margin) + 18px))" };
const overhangRight = { marginRight: "-2.25rem" };

export function PostcardLayout1({ card }: { card: PostcardData }) {
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
    <main className="l1-root relative min-h-svh overflow-x-clip px-4 pt-28 pb-20 sm:px-8 sm:pt-28">
      <Link href="/" className="fixed top-4 left-4 z-30 flex items-center gap-2 font-serif text-2xl italic sm:top-6 sm:left-6">
        <Logo className="h-9 w-9" /> Lately
      </Link>

      <NotebookPaper className="mx-auto w-full max-w-[44rem]">
        <div
          key={page}
          className={cn("relative pt-12 pr-5 pb-20 sm:pr-12", dir === 1 ? "l1-page-next" : "l1-page-prev")}
          style={{ paddingLeft: "calc(var(--margin) + 14px)" }}
        >
          <Delayed>
            {(show) => (
              <RoughNotationGroup show={show}>
                {page === 0 ? <PageOne card={card} onOpen={setView} /> : <PageTwo card={card} onOpen={setView} />}
              </RoughNotationGroup>
            )}
          </Delayed>
          <PageNav page={page} onTurn={turn} />
        </div>
      </NotebookPaper>

      {view ? <PhotoViewer photo={view} onClose={() => setView(null)} /> : null}
    </main>
  );
}

/** Waits for fonts and the page-turn animation so hand-drawn marks land in the right place. */
function Delayed({ children }: { children: (show: boolean) => React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    void document.fonts.ready.then(() => (timer = setTimeout(() => setShow(true), 600)));
    return () => clearTimeout(timer);
  }, []);
  return children(show);
}

/** A photo beside its text. A grid keeps both centered on each other, so no gaps open up. */
function Row({
  photo,
  side,
  tilt,
  width,
  onOpen,
  children,
}: {
  photo: PostcardPhoto | undefined;
  side: "left" | "right";
  tilt: number;
  width: string;
  onOpen: (p: PostcardPhoto) => void;
  children: React.ReactNode;
}) {
  if (!photo) return <div>{children}</div>;
  const left = side === "left";
  return (
    <div className={cn("grid items-center gap-5 sm:gap-8", left ? "grid-cols-[auto_1fr]" : "grid-cols-[1fr_auto]")}>
      {left ? <Polaroid photo={photo} onOpen={onOpen} tilt={tilt} className={width} style={overhangLeft} /> : null}
      <div>{children}</div>
      {left ? null : <Polaroid photo={photo} onOpen={onOpen} tilt={tilt} className={width} style={overhangRight} />}
    </div>
  );
}

function PageOne({ card, onOpen }: { card: PostcardData; onOpen: (p: PostcardPhoto) => void }) {
  const [first, second] = card.photos;
  const extra = card.photos.slice(PLACED);
  return (
    <>
      <Sun className="l1-spin absolute -top-12 -left-10 w-24 sm:-top-14 sm:-left-14 sm:w-32" />

      <header>
        <p className="pl-8 text-[11px] leading-5 font-semibold tracking-[0.2em] text-black/50 uppercase sm:pl-6">
          {card.dates}
        </p>
        <h1 className="mt-5 text-4xl leading-tight font-medium tracking-[-0.03em] sm:text-5xl">
          {card.to}&apos;s week,{" "}
          <span className="font-serif font-normal italic">
            <RoughNotation type="underline" color="#0047ab" strokeWidth={2.5} iterations={2} padding={2}>
              lately.
            </RoughNotation>
          </span>
        </h1>
      </header>

      <div className="mt-6 space-y-4 text-[17px] leading-7 sm:text-lg sm:leading-8">
        <Row photo={first} side="left" tilt={-6} width="w-28 sm:w-40" onOpen={onOpen}>
          <p>
            <MarkedText text={card.notes[0] ?? ""} />
          </p>
        </Row>
        <Row photo={second} side="right" tilt={4} width="w-32 sm:w-48" onOpen={onOpen}>
          {card.notes.slice(1).map((note, i) => (
            <p key={i} className={i > 0 ? "mt-4" : undefined}>
              <MarkedText text={note} />
            </p>
          ))}
        </Row>
      </div>

      <section className="mt-6 grid items-center gap-8 sm:grid-cols-[1fr_auto] sm:gap-12">
        <div>
          {extra.length > 0 ? (
            <p>
              <span className="text-3xl font-medium tracking-tight">+{extra.length}</span>{" "}
              <span className="font-serif text-xl italic">more from the week</span>
            </p>
          ) : null}
          <p className="mt-4 text-lg leading-8">
            <MarkedText text={card.tip} />
          </p>
        </div>
        <PhotoStack photos={extra} onOpen={onOpen} />
      </section>
    </>
  );
}

function PageTwo({ card, onOpen }: { card: PostcardData; onOpen: (p: PostcardPhoto) => void }) {
  const [, , third, fourth, fifth] = card.photos;
  return (
    <>
      <h2 className="text-3xl leading-tight font-medium tracking-[-0.03em] sm:text-4xl">
        Saved for <span className="font-serif font-normal italic">later</span>
      </h2>

      <div className="mt-6 flex flex-wrap items-center gap-6 sm:flex-nowrap">
        {card.recs.map((rec) => (
          <article key={rec.title} className="l1-index-card relative w-full -rotate-1 px-5 pt-2 pb-5 sm:w-[60%]">
            <span aria-hidden className="l1-tape absolute -top-3 left-6 h-6 w-20 -rotate-6" data-tone="blue" />
            <p className="flex h-[44px] items-baseline gap-2 pt-2">
              <span className="text-[11px] font-semibold tracking-[0.2em] text-black/50 uppercase">{rec.kind}</span>
              <span className="font-serif text-2xl italic">{rec.title}</span>
            </p>
            <p className="mt-1 text-base leading-7">
              <MarkedText text={rec.body} />
            </p>
          </article>
        ))}
        <aside className="l1-sticky mx-auto w-48 shrink-0 rotate-3 p-4 sm:mx-0 sm:w-52">
          <p className="text-[11px] font-semibold tracking-[0.2em] text-black/50 uppercase">Fun fact</p>
          <p className="mt-2 font-serif text-2xl leading-7 italic">{card.funFact}</p>
        </aside>
      </div>

      <div className="mt-8 space-y-12 text-[17px] leading-7 sm:text-lg sm:leading-8">
        <Row photo={third} side="right" tilt={5} width="w-32 sm:w-48" onOpen={onOpen}>
          <p>
            <MarkedText text={card.later[0] ?? ""} />
          </p>
          <Ticket ticket={card.ticket} />
        </Row>
        <Row photo={fourth} side="left" tilt={-5} width="w-28 sm:w-40" onOpen={onOpen}>
          {card.later.slice(1).map((text, i) => (
            <p key={i} className={i > 0 ? "mt-4" : undefined}>
              <MarkedText text={text} />
            </p>
          ))}
        </Row>
      </div>

      <div className="mt-10 grid items-end gap-8 sm:grid-cols-[1fr_auto] sm:gap-10">
        <div>
          <SavedDates saved={card.saved} />
          <p className="mt-8 text-lg">{card.signoff}</p>
          <p className="mt-1 font-serif text-4xl italic">{card.from}</p>
        </div>
        {fifth ? <Polaroid photo={fifth} onOpen={onOpen} tilt={7} className="mx-auto w-36 sm:w-44" style={overhangRight} /> : null}
      </div>
    </>
  );
}

/** Hand-drawn sun with hatching, tucked on the corner of page one. */
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

function Ticket({ ticket }: { ticket: PostcardData["ticket"] }) {
  return (
    <div className="l1-ticket mt-6 flex w-full max-w-sm -rotate-2 bg-[#ff9cc8] shadow-md">
      <div className="flex-1 py-3 pr-3 pl-7">
        <p className="text-[10px] font-bold tracking-[0.3em] uppercase">Admit one</p>
        <p className="font-serif text-3xl leading-9 italic">{ticket.title}</p>
        <p className="text-sm leading-5">{ticket.line}</p>
      </div>
      <div className="flex w-20 flex-col items-center justify-center border-l-2 border-dashed border-black/30 pr-4 pl-2 text-center text-xs leading-5 font-semibold">
        {ticket.when}
      </div>
    </div>
  );
}

function SavedDates({ saved }: { saved: PostcardData["saved"] }) {
  const [open, setOpen] = useState<string>();
  return (
    <section>
      <p className="text-[11px] font-semibold tracking-[0.2em] text-black/50 uppercase">Dates worth remembering</p>
      <ul className="mt-3 divide-y divide-black/10 border-y border-black/10">
        {saved.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              aria-expanded={open === item.label}
              onClick={() => setOpen(open === item.label ? undefined : item.label)}
              className="flex w-full items-baseline justify-between gap-4 py-2.5 text-left"
            >
              <span>{item.label}</span>
              <span className="font-serif text-lg italic">{item.when}</span>
            </button>
            {open === item.label ? <p className="pb-3 text-sm text-black/55">{item.note}</p> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function PageNav({ page, onTurn }: { page: number; onTurn: (step: 1 | -1) => void }) {
  return (
    <nav className="absolute right-5 bottom-7 left-[calc(var(--margin)+14px)] flex items-center justify-between text-sm sm:right-12">
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
