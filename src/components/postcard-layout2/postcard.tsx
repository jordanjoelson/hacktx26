"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RoughNotation, RoughNotationGroup } from "react-rough-notation";
import { Logo } from "@/components/logo";
import { cn } from "@/lib/cn";
import "./layout2.css";
import { MarkedText } from "./marked-text";
import { PhotoStack } from "./photo-stack";
import { PhotoViewer } from "./photo-viewer";
import { Rough } from "./rough";
import type { PostcardData, PostcardPhoto } from "@/components/postcard/types";

/** Photos 0–4 get their own cards; the rest go in the flip-through stack. */
const PLACED = 5;
const label = "text-[11px] font-semibold tracking-[0.2em] uppercase";

type Open = (photo: PostcardPhoto) => void;

/**
 * The weekly postcard as a grid of cards with even gutters: photos with their
 * notes, plus a few cards shaped like what they hold (a ticket, a bookmark,
 * a quote, a calendar). Everything is optional to interact with.
 */
export function PostcardLayout2({ card }: { card: PostcardData }) {
  const [view, setView] = useState<PostcardPhoto | null>(null);
  const [thursday, dinner, home, leftOut, walk] = card.photos;
  const extra = card.photos.slice(PLACED);

  return (
    <main className="l2-root min-h-svh px-4 pt-20 pb-16 sm:px-8 sm:pt-24">
      <Link href="/" className="fixed top-4 left-4 z-30 flex items-center gap-2 font-serif text-2xl italic sm:top-6 sm:left-6">
        <Logo className="h-9 w-9" /> Lately
      </Link>

      <Delayed>
        {(show) => (
          <RoughNotationGroup show={show}>
            <div className="mx-auto grid max-w-5xl gap-3 sm:gap-4 md:grid-cols-12">
              <Hero card={card} className="md:col-span-7" />
              {dinner ? <PhotoCard photo={dinner} onOpen={setView} footer={card.tip} aspect="aspect-[16/10]" i={1} className="md:col-span-5" /> : null}

              {thursday ? <StoryCard photo={thursday} onOpen={setView} texts={card.notes.slice(1)} i={2} className="md:col-span-7" /> : null}
              {extra.length > 0 ? <StackCard photos={extra} onOpen={setView} i={3} className="md:col-span-5" /> : null}

              {card.recs.map((rec) => (
                <RecCard key={rec.title} rec={rec} i={4} className="md:col-span-4" />
              ))}
              <QuoteCard text={card.funFact} i={5} className="md:col-span-4" />
              <TicketCard ticket={card.ticket} i={6} className="md:col-span-4" />

              {home ? <StoryCard photo={home} onOpen={setView} texts={card.later} i={7} className="md:col-span-7" /> : null}
              {leftOut ? <PhotoCard photo={leftOut} onOpen={setView} aspect="aspect-[16/10]" i={8} className="md:col-span-5" /> : null}

              <DatesCard saved={card.saved} i={9} className="md:col-span-5" />
              {walk ? <PhotoCard photo={walk} onOpen={setView} i={10} className="md:col-span-3" /> : null}
              <SignoffCard signoff={card.signoff} from={card.from} i={11} className="md:col-span-4" />
            </div>
          </RoughNotationGroup>
        )}
      </Delayed>

      {view ? <PhotoViewer photo={view} onClose={() => setView(null)} /> : null}
    </main>
  );
}

/** Waits for fonts and the cards' entrance so hand-drawn underlines land in the right place. */
function Delayed({ children }: { children: (show: boolean) => React.ReactNode }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    void document.fonts.ready.then(() => (timer = setTimeout(() => setShow(true), 900)));
    return () => clearTimeout(timer);
  }, []);
  return children(show);
}

function Card({ i, className, children }: { i: number; className?: string; children: React.ReactNode }) {
  return (
    <section className={cn("l2-rise relative flex flex-col p-5 sm:p-6", className)} style={{ "--i": i } as React.CSSProperties}>
      {children}
    </section>
  );
}

function Photo({ photo, onOpen, className }: { photo: PostcardPhoto; onOpen: Open; className?: string }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(photo)}
      aria-label={`Open photo: ${photo.caption}`}
      className={cn("group block w-full overflow-hidden bg-neutral-200 outline-none focus-visible:ring-4 focus-visible:ring-[#0047ab]/30", className)}
    >
      <img
        src={photo.src}
        alt={photo.caption}
        className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
        style={{ objectPosition: photo.focus }}
      />
    </button>
  );
}

function Hero({ card, className }: { card: PostcardData; className?: string }) {
  return (
    <Card i={0} className={cn("bg-white", className)}>
      <Sun className="l2-spin absolute top-5 right-5 w-14 sm:top-6 sm:right-6 sm:w-16" />
      <p className={cn(label, "text-black/45")}>{card.dates}</p>
      <h1 className="mt-4 pr-16 text-4xl leading-tight font-medium tracking-[-0.03em] sm:text-5xl">
        {card.to}&apos;s week,{" "}
        <span className="font-serif font-normal italic">
          <RoughNotation type="underline" color="#0047ab" strokeWidth={2.5} iterations={2} padding={2}>
            lately.
          </RoughNotation>
        </span>
      </h1>
      <p className="mt-5 text-[17px] leading-7 text-black/75">
        <MarkedText text={card.notes[0] ?? ""} />
      </p>
      {card.tags?.length ? (
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-6">
          {card.tags.map((tag, i) => (
            <li key={tag} className={cn("border px-2 py-0.5 text-xs", i === 0 ? "border-[#1d1b2e] bg-[#1d1b2e] text-white" : "border-black/15")}>
              {tag}
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

/** Photo on top, caption and an optional line of text underneath. */
function PhotoCard({
  photo,
  onOpen,
  body,
  footer,
  aspect = "aspect-[4/3]",
  i,
  className,
}: {
  photo: PostcardPhoto;
  onOpen: Open;
  body?: string;
  footer?: string;
  aspect?: string;
  i: number;
  className?: string;
}) {
  return (
    <Card i={i} className={cn("bg-white", className)}>
      <Photo photo={photo} onOpen={onOpen} className={aspect} />
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <p className="font-serif text-xl italic">{photo.caption}</p>
        {photo.note ? <p className="shrink-0 text-xs font-medium text-[#e8467f]">✦ {photo.note}</p> : null}
      </div>
      {body ? (
        <p className="mt-2 text-[15px] leading-6 text-black/70">
          <MarkedText text={body} />
        </p>
      ) : null}
      {footer ? (
        <p className="mt-auto pt-3 text-[15px] leading-6 text-black/70">
          <MarkedText text={footer} />
        </p>
      ) : null}
    </Card>
  );
}

/** Photo beside its paragraph, like a short story card. */
function StoryCard({ photo, onOpen, texts, i, className }: { photo: PostcardPhoto; onOpen: Open; texts: string[]; i: number; className?: string }) {
  return (
    <Card i={i} className={cn("grid gap-5 bg-white sm:grid-cols-2", className)}>
      <Photo photo={photo} onOpen={onOpen} className="aspect-[4/3] sm:aspect-auto sm:h-full sm:min-h-56" />
      <div className="flex flex-col">
        <p className="font-serif text-2xl italic">{photo.caption}</p>
        {texts.map((text, n) => (
          <p key={n} className="mt-3 text-[15px] leading-6 text-black/75">
            <MarkedText text={text} />
          </p>
        ))}
      </div>
    </Card>
  );
}

function StackCard({ photos, onOpen, i, className }: { photos: PostcardPhoto[]; onOpen: Open; i: number; className?: string }) {
  return (
    <Card i={i} className={cn("items-center bg-white", className)}>
      <p className="self-start">
        <span className="text-2xl font-medium tracking-tight">+{photos.length}</span>{" "}
        <span className="font-serif text-lg italic">more from the week</span>
      </p>
      <div className="mt-5 w-full px-6">
        <PhotoStack photos={photos} onOpen={onOpen} />
      </div>
    </Card>
  );
}

/** A bookmarked recommendation. */
function RecCard({ rec, i, className }: { rec: PostcardData["recs"][number]; i: number; className?: string }) {
  return (
    <Card i={i} className={cn("min-h-64 bg-[#f9d34a] text-[#4a3200]", className)}>
      <span aria-hidden className="l2-ribbon absolute top-0 right-6 h-14 w-7 bg-[#e8467f]" />
      <p className={label}>{rec.kind}</p>
      <p className="mt-2 font-serif text-3xl italic">{rec.title}</p>
      <p className="mt-auto pt-6 text-[15px] leading-6">
        <MarkedText text={rec.body} />
      </p>
    </Card>
  );
}

/** A fact set between big quote marks. */
function QuoteCard({ text, i, className }: { text: string; i: number; className?: string }) {
  return (
    <Card i={i} className={cn("min-h-64 bg-[#cbb8f2] text-[#3b1d5c]", className)}>
      <p className={label}>Fun fact</p>
      <span aria-hidden className="mt-1 font-serif text-7xl leading-none">“</span>
      <p className="-mt-4 font-serif text-2xl leading-8 italic">{text}</p>
      <span aria-hidden className="mt-auto self-end font-serif text-7xl leading-[0.5]">”</span>
    </Card>
  );
}

/** The card itself is cut like a ticket stub. */
function TicketCard({ ticket, i, className }: { ticket: PostcardData["ticket"]; i: number; className?: string }) {
  return (
    <section className={cn("l2-rise l2-ticket flex min-h-64 bg-[#ff9cc8] text-[#4a0f2c]", className)} style={{ "--i": i } as React.CSSProperties}>
      <div className="flex flex-1 flex-col p-5 pl-8 sm:p-6 sm:pl-9">
        <p className={label}>Admit one</p>
        <p className="mt-2 font-serif text-3xl italic">{ticket.title}</p>
        <p className="mt-auto pt-6 text-[15px] leading-6">{ticket.line}</p>
      </div>
      <div className="flex w-16 shrink-0 items-center justify-center border-l-2 border-dashed border-[#4a0f2c]/30 pr-3">
        <p className={cn(label, "rotate-90 whitespace-nowrap")}>{ticket.when}</p>
      </div>
    </section>
  );
}

/** Dates under a little calendar page. */
function DatesCard({ saved, i, className }: { saved: PostcardData["saved"]; i: number; className?: string }) {
  const [open, setOpen] = useState<string>();
  return (
    <Card i={i} className={cn("bg-white", className)}>
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
              <span className="font-serif text-lg italic">{item.when}</span>
            </button>
            {open === item.label ? <p className="pb-3 text-sm text-black/55">{item.note}</p> : null}
          </li>
        ))}
      </ul>
    </Card>
  );
}

/** The closing, on an envelope-blue card. */
function SignoffCard({ signoff, from, i, className }: { signoff: string; from: string; i: number; className?: string }) {
  return (
    <Card i={i} className={cn("min-h-56 bg-[#0047ab] text-white", className)}>
      <EnvelopeIcon />
      <p className="mt-auto text-lg">{signoff}</p>
      <p className="mt-1 font-serif text-5xl italic">{from}</p>
    </Card>
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
    <svg width="52" height="38" viewBox="0 0 52 38" aria-hidden className="self-end">
      <rect x="1.5" y="1.5" width="49" height="35" rx="3" fill="none" stroke="#fff" strokeWidth="2.5" />
      <path d="M2.5 3 26 21 49.5 3" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      <circle cx="26" cy="21" r="4.5" fill="#f9d34a" />
    </svg>
  );
}
