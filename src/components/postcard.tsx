"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { LatelyMascot } from "@/components/lately-mascot";
import { PostcardListen } from "@/components/postcard-listen";
import type { PostcardContent } from "@/lib/postcard";
import { plainPostcardText, postcardNarration } from "@/lib/postcard-reading";
import styles from "./postcard.module.css";

type PhotoView = { src: string; caption: string };
const FALLBACK_TITLES = ["The week, in a few words.", "A little update.", "Before I forget."];

/** One flexible edition, shared by the sample, the recipient link, and the editor. */
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
  const minutes = Math.max(1, Math.ceil(narration.split(/\s+/).length / 220));
  const stories = content.stories.map((body, index) => ({ body, index }))
    .filter(({ body }) => body.trim() || onChange);
  const usedPhotos = new Set(stories.map(({ index }) => index));
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

  function storyCard({ body, index }: { body: string; index: number }, lead = false) {
    const photo = content.photos[index];
    const hasPhoto = Boolean(photo?.src.trim());
    const title = content.storyTitles?.[index] || FALLBACK_TITLES[index] || "Another little moment.";
    return (
      <article key={index} className={`${styles.story} ${lead ? styles.leadStory : ""} ${!hasPhoto ? styles.textStory : ""}`}>
        {hasPhoto && <Photo src={photo.src} caption={photo.caption} name={name} onOpen={setView}
          onCaption={edit((d, v) => { d.photos[index].caption = v; })} lead={lead} />}
        <div className={styles.storyCopy}>
          <div className={styles.storyEyebrow}><span>{String(index + 1).padStart(2, "0")}</span><span>{lead ? "THE PART I WANTED TO TELL YOU" : "A MOMENT FROM THE WEEK"}</span></div>
          <h2 className={styles.storyTitle}><Text value={title} name={name} label="Story heading" single
            onChange={content.storyTitles?.[index] !== undefined ? edit((d, v) => { d.storyTitles![index] = v; }) : undefined} /></h2>
          <div className={styles.prose}><Text value={body} name={name} label="Story" onChange={edit((d, v) => { d.stories[index] = v; })} /></div>
        </div>
      </article>
    );
  }

  return (
    <main className={`${styles.page} ${className}`}>
      <div className={styles.shell}>
        <nav className={styles.topbar} aria-label="Postcard navigation">
          <Link href="/" className={styles.brand} aria-label="Lately home">
            <LatelyMascot size={32} animation="none" />
            <span>Lately<span className={styles.brandDot}>.</span></span>
          </Link>
          <div className={styles.topbarRight}>{controls || <span>{onChange ? "Your postcard, in the making." : "A little closer, every week."}</span>}</div>
        </nav>

        <header className={styles.header}>
          <div className={styles.editionLine}>
            <span className={styles.eyebrow}>THE WEEKLY POSTCARD</span>
            {content.period && <span><Text value={content.period} name={name} label="Edition dates" single onChange={edit((d, v) => { d.period = v; })} /></span>}
          </div>
          <div className={styles.headingRow}>
            <div className={styles.headingCopy}>
              <h1 className={styles.title}><Text value={content.title || "A little of life,\nlately."} name={name} label="Postcard title"
                onChange={content.title !== undefined ? edit((d, v) => { d.title = v; }) : undefined} /></h1>
              {content.intro && <div className={styles.dek}><Text value={content.intro} name={name} label="Introduction" onChange={edit((d, v) => { d.intro = v; })} /></div>}
            </div>
            <div className={styles.address}>
              <span className={styles.addressLabel}>A NOTE BETWEEN FRIENDS</span>
              <div className={styles.addressNames}>
                <span className={styles.avatar} aria-hidden="true">{from[0].toUpperCase()}</span>
                <div><span className={styles.fromName}><Text value={content.from} name={name} label="Sender" single onChange={edit((d, v) => { d.from = v; })} /></span>
                  <span className={styles.toName}>to <Text value={content.to} name={name} label="Recipient" single onChange={edit((d, v) => { d.to = v; })} /></span></div>
              </div>
              <span className={styles.readTime}>{minutes} min read <span aria-hidden="true">/</span> Best read with a coffee.</span>
            </div>
          </div>
        </header>

        <PostcardListen key={narration} text={narration} />

        <div className={styles.sectionLabel}><span>THE WEEK, KEPT CLOSE</span><span>{content.photos.filter((photo) => photo.src.trim()).length} photos & a few words</span></div>
        {stories[0] && storyCard(stories[0], true)}

        {content.funFact.trim() && <aside className={styles.pullquote}>
          <span className={styles.quoteLabel}>A SMALL REALIZATION</span>
          <blockquote><Text value={content.funFact} name={name} label="Small realization" onChange={edit((d, v) => { d.funFact = v; })} /></blockquote>
        </aside>}

        {stories.length > 1 && <div className={styles.storyGrid}>{stories.slice(1).map((story) => storyCard(story))}</div>}

        {extraPhotos.length > 0 && <section className={styles.cameraRoll} aria-label="More photos from the week">
          <div className={styles.sectionLabel}><span>ONE MORE LOOK</span><span>From the camera roll</span></div>
          <div className={styles.photoGrid}>
            {extraPhotos.map((photo) => <Photo key={photo.index} src={photo.src} caption={photo.caption} name={name} onOpen={setView}
              onCaption={edit((d, v) => { d.photos[photo.index].caption = v; })} />)}
          </div>
        </section>}

        {(recs.length > 0 || content.tip.trim() || dates.length > 0) && <div className={styles.extras}>
          {(recs.length > 0 || content.tip.trim()) && <section className={styles.recommendations}>
            <span className={styles.eyebrow}>PASSED ALONG</span>
            <h2 className={styles.sectionTitle}>Thought you&apos;d like these.</h2>
            {recs.map((rec, i) => <article className={styles.recommendation} key={rec.index}>
              <span className={styles.recNumber}>{String(i + 1).padStart(2, "0")}</span>
              <div><h3><Text value={rec.title} name={name} label="Recommendation title" single onChange={edit((d, v) => { d.recs[rec.index].title = v; })} /></h3>
                <div className={styles.smallProse}><Text value={rec.body} name={name} label="Recommendation" onChange={edit((d, v) => { d.recs[rec.index].body = v; })} /></div></div>
            </article>)}
            {content.tip.trim() && <div className={styles.postscript}><span>P.S.</span><div><Text value={content.tip} name={name} label="Postscript" onChange={edit((d, v) => { d.tip = v; })} /></div></div>}
          </section>}
          {dates.length > 0 && <aside className={styles.calendar}>
            <span className={styles.eyebrow}>SOMETHING TO LOOK FORWARD TO</span>
            <h2 className={styles.sectionTitle}>On the calendar.</h2>
            {dates.map((date) => <div className={styles.date} key={date.index}>
              <span className={styles.dateWhen}><Text value={date.when} name={name} label="Date" single onChange={edit((d, v) => { d.dates[date.index].when = v; })} /></span>
              <div><h3><Text value={date.label} name={name} label="Occasion" single onChange={edit((d, v) => { d.dates[date.index].label = v; })} /></h3>
                <div className={styles.smallProse}><Text value={date.note} name={name} label="Date note" onChange={edit((d, v) => { d.dates[date.index].note = v; })} /></div></div>
            </div>)}
          </aside>}
        </div>}

        <footer className={styles.footer}>
          <div><span className={styles.signoff}>Until next time,</span><span className={styles.signature}>{from}</span></div>
          <div className={styles.footerBrand}><LatelyMascot size={42} animation="none" /><span>A little life, sent with Lately.</span></div>
        </footer>
      </div>
      {view && <Viewer src={view.src} caption={plainPostcardText(view.caption, name)} onClose={() => setView(null)} />}
    </main>
  );
}

const MARKUP = /(==.+?==|\+\+.+?\+\+|~~.+?~~)/g;
function rich(text: string, name: string): ReactNode {
  return text.replaceAll("{name}", name).split(MARKUP).map((part, i) => {
    if (i % 2 === 0) return part;
    if (part.startsWith("~~")) return <s key={i}>{part.slice(2, -2)}</s>;
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
    {value.trim() ? rich(value, name) : <span className={styles.emptyText}>Write a little something…</span>}
  </button>;
}

function Photo({ src, caption, name, onOpen, onCaption, lead = false }: {
  src: string; caption: string; name: string; onOpen: (view: PhotoView) => void;
  onCaption?: (value: string) => void; lead?: boolean;
}) {
  const [failed, setFailed] = useState<string | null>(null);
  const alt = plainPostcardText(caption, name) || "A photo from the week";
  return <figure className={styles.photo}>
    <button type="button" className={styles.photoButton} onClick={() => onOpen({ src, caption })} aria-label={`Open photo: ${alt}`} disabled={failed === src}>
      {failed === src ? <span className={styles.imageFallback}>This photo isn&apos;t available right now.</span> : <>
        <Image src={src} alt={alt} fill sizes={lead ? "(max-width: 760px) 100vw, 620px" : "(max-width: 760px) 100vw, 540px"}
          unoptimized={!src.startsWith("/")} className={styles.photoImage} onError={() => setFailed(src)} />
        <span className={styles.expandIcon} aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 3h5v5M17 3l-6 6M8 17H3v-5m0 5 6-6" /></svg></span>
      </>}
    </button>
    <figcaption><Text value={caption} name={name} label="Photo caption" onChange={onCaption} /></figcaption>
  </figure>;
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
