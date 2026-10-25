"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { LatelyMascot } from "@/components/lately-mascot";
import { PostcardListen } from "@/components/postcard-listen";
import { storyPhotoIndexes, type PostcardContent } from "@/lib/postcard";
import { plainPostcardText, postcardNarration } from "@/lib/postcard-reading";
import styles from "./postcard.module.css";

type PhotoView = { src: string; caption: string };
const FALLBACK_TITLES = ["The week, in a few words.", "A little update.", "Before I forget."];

/**
 * One recap, shared by the sample, the recipient link, and the editor. A single feed-width column in the
 * homepage's dark style. `controls` fills the top-right slot (e.g. Edit) and is only passed to the owner.
 */
export function Postcard({ content, onChange, className = "", controls }: {
  content: PostcardContent;
  onChange?: (next: PostcardContent) => void;
  className?: string;
  controls?: ReactNode;
}) {
  const name = content.to.trim() || "you";
  const from = content.from.trim() || "a friend";
  const [view, setView] = useState<PhotoView | null>(null);
  const narration = postcardNarration(content);
  const stories = content.stories.map((body, index) => ({ body, index }))
    .filter(({ body }) => body.trim() || onChange);
  const usedPhotos = new Set(stories.flatMap(({ index }) => storyPhotoIndexes(content, index)));
  const extraPhotos = content.photos.map((photo, index) => ({ ...photo, index }))
    .filter((photo) => photo.src.trim() && !usedPhotos.has(photo.index));
  const recs = content.recs.map((rec, index) => ({ ...rec, index }))
    .filter((rec) => rec.title.trim() || rec.body.trim() || onChange);
  const dates = content.dates.map((date, index) => ({ ...date, index }))
    .filter((date) => date.label.trim() || date.note.trim() || onChange);

  function edit(apply: (draft: PostcardContent, value: string) => void) {
    if (!onChange) return undefined;
    return (value: string) => {
      const draft = structuredClone(content);
      apply(draft, value);
      onChange(draft);
    };
  }

  function storyCard({ body, index }: { body: string; index: number }) {
    const photoIndexes = storyPhotoIndexes(content, index);
    // The first story's photo is the biggest thing on screen at load, so don't lazy-load it.
    const eager = index === stories[0]?.index;
    const photo = photoIndexes.length === 1 ? content.photos[photoIndexes[0]] : undefined;
    const title = content.storyTitles?.[index] || FALLBACK_TITLES[index] || "Another little moment.";
    return (
      <article key={index} className={styles.card}>
        {photo && <Photo src={photo.src} caption={photo.caption} name={name} onOpen={setView} eager={eager}
          onCaption={edit((d, v) => { d.photos[photoIndexes[0]].caption = v; })} />}
        {photoIndexes.length > 1 && (() => {
          const group = photoIndexes.map((i) => ({ ...content.photos[i], index: i }));
          const captionEditor = onChange ? (i: number) => edit((d, v) => { d.photos[i].caption = v; }) : undefined;
          return group.length >= 4
            ? <Stack photos={group} name={name} onOpen={setView} captionEditor={captionEditor} eager={eager} />
            : <Collage photos={group} name={name} onOpen={setView} captionEditor={captionEditor} eager={eager} />;
        })()}
        <div className={styles.cardBody}>
          <h2 className={styles.storyTitle}><Text value={title} name={name} label="Story heading" single
            onChange={content.storyTitles?.[index] !== undefined ? edit((d, v) => { d.storyTitles![index] = v; }) : undefined} /></h2>
          <div className={styles.prose}><Text value={body} name={name} label="Story" onChange={edit((d, v) => { d.stories[index] = v; })} /></div>
        </div>
      </article>
    );
  }

  return (
    <main className={`${styles.page} ${className}`}>
      <nav className={styles.topbar} aria-label="Recap">
        <Link href="/" className={styles.brand} aria-label="Lately home">
          <LatelyMascot size={28} animation="none" />
          <span>Lately</span>
        </Link>
        {controls && <div className={styles.topbarRight}>{controls}</div>}
      </nav>

      <div className={styles.feed}>
        <header className={styles.header}>
          <div className={styles.byline}>
            <span className={styles.avatar} aria-hidden="true">{from[0].toUpperCase()}</span>
            <div className={styles.bylineText}>
              <span className={styles.fromName}><Text value={content.from} name={name} label="Sender" single onChange={edit((d, v) => { d.from = v; })} /></span>
              <span className={styles.meta}>
                to <Text value={content.to} name={name} label="Recipient" single onChange={edit((d, v) => { d.to = v; })} />
                {content.period && <> · <Text value={content.period} name={name} label="Dates" single onChange={edit((d, v) => { d.period = v; })} /></>}
              </span>
            </div>
          </div>
          <h1 className={styles.title}><Text value={content.title || "A little of life, lately."} name={name} label="Title"
            onChange={content.title !== undefined ? edit((d, v) => { d.title = v; }) : undefined} /></h1>
          {content.intro && <div className={styles.dek}><Text value={content.intro} name={name} label="Introduction" onChange={edit((d, v) => { d.intro = v; })} /></div>}
          <PostcardListen key={narration} text={narration} />
        </header>

        {content.opener?.trim() && <aside className={styles.opener}>
          <span className={styles.label}>Before you read</span>
          <p><Text value={content.opener} name={name} label="Opener" onChange={edit((d, v) => { d.opener = v; })} /></p>
        </aside>}

        {stories[0] && storyCard(stories[0])}

        {content.funFact.trim() && <aside className={styles.highlight}>
          <span className={styles.label}>A small realization</span>
          <p><Text value={content.funFact} name={name} label="Small realization" onChange={edit((d, v) => { d.funFact = v; })} /></p>
        </aside>}

        {stories.slice(1).map((story) => storyCard(story))}

        {extraPhotos.length > 0 && <section className={styles.photoGrid} aria-label="More photos from the week">
          {extraPhotos.map((photo) => <Photo key={photo.index} src={photo.src} caption={photo.caption} name={name} onOpen={setView}
            onCaption={edit((d, v) => { d.photos[photo.index].caption = v; })} />)}
        </section>}

        {(recs.length > 0 || content.tip.trim()) && <section className={styles.card}>
          <div className={styles.cardBody}>
            <h2 className={styles.sectionTitle}>Thought you&apos;d like these</h2>
            {recs.map((rec) => <div className={styles.listItem} key={rec.index}>
              <h3><Text value={rec.title} name={name} label="Recommendation title" single onChange={edit((d, v) => { d.recs[rec.index].title = v; })} /></h3>
              <div className={styles.small}><Text value={rec.body} name={name} label="Recommendation" onChange={edit((d, v) => { d.recs[rec.index].body = v; })} /></div>
              {rec.url?.startsWith("https://") && <a className={styles.recLink} href={rec.url} target="_blank" rel="noopener noreferrer">
                {linkLabel(rec.url)} <span aria-hidden="true">↗</span></a>}
            </div>)}
            {content.tip.trim() && <div className={styles.postscript}><span className={styles.label}>P.S.</span>
              <div className={styles.small}><Text value={content.tip} name={name} label="Postscript" onChange={edit((d, v) => { d.tip = v; })} /></div></div>}
          </div>
        </section>}

        {dates.length > 0 && <section className={styles.card}>
          <div className={styles.cardBody}>
            <h2 className={styles.sectionTitle}>Coming up</h2>
            {dates.map((date) => <div className={styles.dateRow} key={date.index}>
              <span className={styles.dateChip}><Text value={date.when} name={name} label="Date" single onChange={edit((d, v) => { d.dates[date.index].when = v; })} /></span>
              <div className={styles.dateText}>
                <h3><Text value={date.label} name={name} label="Occasion" single onChange={edit((d, v) => { d.dates[date.index].label = v; })} /></h3>
                <div className={styles.small}><Text value={date.note} name={name} label="Date note" onChange={edit((d, v) => { d.dates[date.index].note = v; })} /></div>
              </div>
            </div>)}
          </div>
        </section>}

        <footer className={styles.footer}>
          <div>
            <span className={styles.signoff}>Until next time,</span>
            <span className={styles.signature}>{from}</span>
          </div>
          <Link href="/" className={styles.footerBrand}><LatelyMascot size={24} animation="none" /><span>Sent with Lately</span></Link>
        </footer>
      </div>
      {content.celebrate && !onChange && <Confetti />}
      {view && <Viewer src={view.src} caption={plainPostcardText(view.caption, name)} onClose={() => setView(null)} />}
    </main>
  );
}

const MARKUP = /(==.+?==|\+\+.+?\+\+|~~.+?~~|\|\|.+?\|\|)/g;
/** `interactive` is false inside the edit buttons, where a spoiler can't be its own button; it shows revealed there. */
function rich(text: string, name: string, interactive = true): ReactNode {
  return text.replaceAll("{name}", name).split(MARKUP).map((part, i) => {
    if (i % 2 === 0) return part;
    if (part.startsWith("~~")) return <s key={i}>{part.slice(2, -2)}</s>;
    if (part.startsWith("||")) return interactive
      ? <Spoiler key={i}>{part.slice(2, -2)}</Spoiler>
      : <span key={i} className={styles.spoilerShown}>{part.slice(2, -2)}</span>;
    return <mark className={part.startsWith("++") ? styles.pinkMark : styles.mark} key={i}>{part.slice(2, -2)}</mark>;
  });
}

function Text({ value, name, onChange, single = false, label }: {
  value: string; name: string; onChange?: (value: string) => void; single?: boolean; label: string;
}) {
  const [editing, setEditing] = useState(false);
  const area = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    if (!area.current) return;
    area.current.style.height = "auto";
    area.current.style.height = `${area.current.scrollHeight}px`;
  }, [editing, value]);
  if (!onChange) return <>{rich(value, name)}</>;
  if (editing) {
    const common = {
      autoFocus: true, value, "aria-label": label, className: styles.editField,
      onBlur: () => setEditing(false),
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(event.target.value),
      onKeyDown: (event: React.KeyboardEvent) => { if (event.key === "Escape" || (single && event.key === "Enter")) setEditing(false); },
    };
    return single ? <input {...common} /> : <textarea {...common} ref={area} />;
  }
  return <button type="button" className={styles.editText} aria-label={`Edit ${label.toLowerCase()}`} onClick={() => setEditing(true)}>
    {value.trim() ? rich(value, name, false) : <span className={styles.emptyText}>Write a little something…</span>}
  </button>;
}

function Photo({ src, caption, name, onOpen, onCaption, eager = false }: {
  src: string; caption: string; name: string; onOpen: (view: PhotoView) => void;
  onCaption?: (value: string) => void; eager?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const alt = plainPostcardText(caption, name) || "A photo from the week";
  return <figure className={styles.photo}>
    <button type="button" className={styles.photoButton} onClick={() => onOpen({ src, caption })} aria-label={`Open photo: ${alt}`} disabled={failed === src}>
      {failed === src ? <span className={styles.imageFallback}>This photo isn&apos;t available right now.</span> : <>
        <Image src={src} alt={alt} fill sizes="(max-width: 640px) 100vw, 600px" loading={eager ? "eager" : "lazy"}
          unoptimized={!src.startsWith("/")} className={styles.photoImage} onError={() => setFailed(src)} />
        <span className={styles.expandIcon} aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3h5v5M17 3l-6 6M8 17H3v-5m0 5 6-6" /></svg></span>
      </>}
    </button>
    <figcaption><Text value={caption} name={name} label="Photo caption" onChange={onCaption} /></figcaption>
  </figure>;
}

/** 2 photos side by side, or 3 as one big and two stacked. 4+ use Stack. */
function Collage({ photos, name, onOpen, captionEditor, eager = false }: {
  photos: { src: string; caption: string; index: number }[];
  name: string;
  onOpen: (view: PhotoView) => void;
  captionEditor?: (photoIndex: number) => ((value: string) => void) | undefined;
  eager?: boolean;
}) {
  const layout = photos.length === 2 ? styles.collage2 : styles.collage3;
  const firstCaption = photos.find((photo) => photo.caption.trim())?.caption;
  return <figure className={styles.photo}>
    <div className={`${styles.collage} ${layout}`}>
      {photos.slice(0, 3).map((photo) => {
        const alt = plainPostcardText(photo.caption, name) || "A photo from the week";
        return <button key={photo.index} type="button" className={styles.collageTile}
          onClick={() => onOpen({ src: photo.src, caption: photo.caption })} aria-label={`Open photo: ${alt}`}>
          <Image src={photo.src} alt={alt} fill sizes="(max-width: 640px) 50vw, 300px" loading={eager ? "eager" : "lazy"}
            unoptimized={!photo.src.startsWith("/")} className={styles.photoImage} />
        </button>;
      })}
    </div>
    {captionEditor
      ? <figcaption>{photos.map((photo, i) => <div key={photo.index}>
          <Text value={photo.caption} name={name} label={`Photo ${i + 1} caption`} onChange={captionEditor(photo.index)} />
        </div>)}</figcaption>
      : firstCaption && <figcaption><Text value={firstCaption} name={name} label="Photo caption" /></figcaption>}
  </figure>;
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

/** 4+ photos: swipe through one at a time (arrows on desktop), with a counter and dots. */
function Stack({ photos, name, onOpen, captionEditor, eager = false }: {
  photos: { src: string; caption: string; index: number }[];
  name: string;
  onOpen: (view: PhotoView) => void;
  captionEditor?: (photoIndex: number) => ((value: string) => void) | undefined;
  eager?: boolean;
}) {
  const [current, setCurrent] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const go = (step: number) => {
    const el = track.current;
    if (el) el.scrollBy({ left: step * el.clientWidth, behavior: "smooth" });
  };
  return <figure className={styles.photo}>
    <div className={styles.stack}>
      <div ref={track} className={styles.stackTrack} aria-label="Photos, swipe for more"
        onScroll={(event) => { const el = event.currentTarget; setCurrent(Math.round(el.scrollLeft / el.clientWidth)); }}>
        {photos.map((photo, i) => {
          const alt = plainPostcardText(photo.caption, name) || "A photo from the week";
          return <button key={photo.index} type="button" className={styles.stackSlide}
            onClick={() => onOpen({ src: photo.src, caption: photo.caption })} aria-label={`Open photo ${i + 1} of ${photos.length}: ${alt}`}>
            <Image src={photo.src} alt={alt} fill sizes="(max-width: 640px) 100vw, 600px" loading={eager && i === 0 ? "eager" : "lazy"}
              unoptimized={!photo.src.startsWith("/")} className={styles.photoImage} />
          </button>;
        })}
      </div>
      <span className={styles.stackCount} aria-hidden="true">{current + 1}/{photos.length}</span>
      {current > 0 && <button type="button" className={`${styles.stackArrow} ${styles.stackPrev}`} onClick={() => go(-1)} aria-label="Previous photo">‹</button>}
      {current < photos.length - 1 && <button type="button" className={`${styles.stackArrow} ${styles.stackNext}`} onClick={() => go(1)} aria-label="Next photo">›</button>}
    </div>
    <div className={styles.dots} aria-hidden="true">
      {photos.map((photo, i) => <span key={photo.index} className={i === current ? styles.dotOn : styles.dot} />)}
    </div>
    {captionEditor
      ? <figcaption>{photos.map((photo, i) => <div key={photo.index}>
          <Text value={photo.caption} name={name} label={`Photo ${i + 1} caption`} onChange={captionEditor(photo.index)} />
        </div>)}</figcaption>
      : photos[current]?.caption.trim() && <figcaption><Text value={photos[current].caption} name={name} label="Photo caption" /></figcaption>}
  </figure>;
}

/** Discord-style spoiler: hidden until tapped. */
function Spoiler({ children }: { children: ReactNode }) {
  const [shown, setShown] = useState(false);
  if (shown) return <span className={styles.spoilerShown}>{children}</span>;
  return <button type="button" className={styles.spoiler} onClick={() => setShown(true)} aria-label="Spoiler, tap to reveal">
    <span aria-hidden="true">{children}</span>
  </button>;
}

const CONFETTI_COLORS = ["#8bb8e8", "#ff9e80", "#6fdcae", "#ffd166", "#c3a6ff", "#f5f5f7"];

/** One burst of confetti when a good-news recap opens. Pieces are made after mount, so server and client render the same. */
function Confetti() {
  const [pieces, setPieces] = useState<{ left: number; delay: number; drift: number; spin: number; color: string; wide: boolean }[]>([]);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Pieces are randomized once on mount; this is the one place the effect sets state on purpose.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPieces(Array.from({ length: 70 }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 0.4,
      drift: (Math.random() - 0.5) * 160,
      spin: (Math.random() - 0.5) * 1080,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      wide: Math.random() > 0.5,
    })));
    const done = setTimeout(() => setPieces([]), 3200);
    return () => clearTimeout(done);
  }, []);
  if (pieces.length === 0) return null;
  return <div className={styles.confetti} aria-hidden="true">
    {pieces.map((piece, i) => <span key={i} className={piece.wide ? styles.confettiWide : styles.confettiPiece} style={{
      left: `${piece.left}%`, background: piece.color, animationDelay: `${piece.delay}s`,
      "--drift": `${piece.drift}px`, "--spin": `${piece.spin}deg`,
    } as React.CSSProperties} />)}
  </div>;
}

function Viewer({ src, caption, onClose }: PhotoView & { onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    dialog?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };
  }, []);
  return <dialog ref={ref} className={styles.viewer} aria-label={caption || "Photo from the postcard"}
    onCancel={onClose} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className={styles.viewerFrame}>
      <button type="button" className={styles.viewerClose} aria-label="Close photo" onClick={onClose}>×</button>
      <div className={styles.viewerImage}><Image src={src} alt={caption} fill sizes="90vw" unoptimized className={styles.containImage} /></div>
      {caption && <p>{caption}</p>}
    </div>
  </dialog>;
}
