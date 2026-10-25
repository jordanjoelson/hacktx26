// Postcard content: one person's weekly postcard, stored as JSON in postcards.content.
// Text fields support ==highlight==, ++pink highlight++, **bold**, ~~cross out~~, ||spoiler|| (tap to reveal), and {name} for the recipient.
// Shared with the web app (src/lib/postcard.ts re-exports it), so keep it free of imports and path aliases.

export interface PostcardPhoto {
  src: string;
  caption: string;
  /** Which story this photo goes with; several photos on one story become a collage. Untagged recaps pair photo i with story i. */
  story?: number;
}

export interface PostcardRec {
  title: string;
  body: string;
  /** A search link the agent builds from the rec (book, place, song...). Never set from the browser. */
  url?: string;
}

export interface PostcardDate {
  label: string;
  when: string;
  note: string;
}

export interface PostcardContent {
  from: string;
  to: string;
  /** Optional editorial fields; older recaps still render without them. */
  title?: string;
  intro?: string;
  /** A playful opening line at the top. Not a question: recipients should never feel they owe a reply. */
  opener?: string;
  /** Good-news week: the recap opens with a burst of confetti. Set by the agent, never from the browser. */
  celebrate?: boolean;
  period?: string;
  storyTitles?: string[];
  stories: string[];
  photos: PostcardPhoto[];
  recs: PostcardRec[];
  tip: string;
  funFact: string;
  dates: PostcardDate[];
  /** How the sender styled it in the editor. Missing fields use DEFAULT_STYLE. Set from the browser, never by the agent. */
  style?: PostcardStyle;
}

/** Blog: Jordan's single-column feed. Paper: sheets of paper with mood-colored sections. Grid: a card grid. */
export type PostcardFormat = "blog" | "paper" | "grid";
export type PostcardMode = "light" | "dark";
export type PostcardAlign = "left" | "center" | "justify";
/** Which side photos sit on beside their text (paper and grid). */
export type PostcardPhotoSide = "alternate" | "left" | "right";

/** Section labels the sender can rename, e.g. "Fun fact". Missing labels use the format's default wording. */
export const LABEL_KEYS = ["opener", "funFact", "recs", "tip", "dates", "later", "signoff"] as const;
export type PostcardLabelKey = (typeof LABEL_KEYS)[number];

export interface PostcardStyle {
  format?: PostcardFormat;
  mode?: PostcardMode;
  /** Alignment of the body text. */
  align?: PostcardAlign;
  photoSide?: PostcardPhotoSide;
  /** Story and section titles in bold (the default) or regular weight. */
  boldHeadings?: boolean;
  labels?: Partial<Record<PostcardLabelKey, string>>;
}

export const DEFAULT_STYLE: Required<Omit<PostcardStyle, "labels">> = {
  format: "blog",
  mode: "dark",
  align: "left",
  photoSide: "alternate",
  boldHeadings: true,
};

const MAX_LABEL = 60;
const oneOf = <T extends string>(value: unknown, options: readonly T[]): T | undefined =>
  options.includes(value as T) ? (value as T) : undefined;

/**
 * Keeps only valid style settings from untrusted input (the browser). Anything unknown is dropped,
 * labels are trimmed to short single lines, and an empty result is undefined.
 */
export function sanitizeStyle(input: unknown): PostcardStyle | undefined {
  if (!input || typeof input !== "object") return undefined;
  const raw = input as Record<string, unknown>;
  const style: PostcardStyle = {};
  const format = oneOf(raw.format, ["blog", "paper", "grid"] as const);
  const mode = oneOf(raw.mode, ["light", "dark"] as const);
  const align = oneOf(raw.align, ["left", "center", "justify"] as const);
  const photoSide = oneOf(raw.photoSide, ["alternate", "left", "right"] as const);
  if (format) style.format = format;
  if (mode) style.mode = mode;
  if (align) style.align = align;
  if (photoSide) style.photoSide = photoSide;
  if (typeof raw.boldHeadings === "boolean") style.boldHeadings = raw.boldHeadings;
  if (raw.labels && typeof raw.labels === "object") {
    const labels: Partial<Record<PostcardLabelKey, string>> = {};
    for (const key of LABEL_KEYS) {
      const value = (raw.labels as Record<string, unknown>)[key];
      if (typeof value === "string" && value.trim()) labels[key] = value.replace(/\s+/g, " ").trim().slice(0, MAX_LABEL);
    }
    if (Object.keys(labels).length) style.labels = labels;
  }
  return Object.keys(style).length ? style : undefined;
}

/** The style with defaults filled in. */
export function resolveStyle(style: PostcardStyle | undefined): Required<Omit<PostcardStyle, "labels">> & { labels: PostcardStyle["labels"] } {
  return { ...DEFAULT_STYLE, ...style, labels: style?.labels };
}

export const SAMPLE_POSTCARD: PostcardContent = {
  from: "Jordan",
  to: "Maya",
  title: "Good food.\nBetter company.",
  intro: "A dinner that ran late, the long way home, and a small win I've been meaning to tell you about.",
  celebrate: true,
  opener: "Fair warning: this week involved rescued pasta and a very unnecessary bookstore detour.",
  period: "October 19–25, 2026",
  storyTitles: ["Nobody left at nine.", "The long way was the good way.", "Finally, a little room to breathe.", "The camera roll."],
  stories: [
    "I invited a few people over on Saturday with the very ambitious promise of dinner at seven. We ate at eight. The pasta needed rescuing, Sam brought enough bread for a small village, and somebody put on the playlist you made last summer.\n\nI kept thinking we'd clear the plates and call it a night. Instead, we opened the windows, made another pot of coffee, and stayed at the table until almost midnight. No occasion. No particularly good reason. Just one of those nights that feels better than anything you could have planned.\n\nYou would've loved it, {name}. Next time, that empty place is yours.",
    "On Thursday I missed my bus and decided to walk instead of waiting for the next one. It added forty minutes to the trip, which turned out to be exactly what I needed.\n\nThe trees have finally gone gold. I found a tiny bookstore with a whole shelf of books about places neither of us has been, bought one I absolutely didn't need, and sat outside until the light started to go.\n\nI'm trying to do more of that. Leave a little space for the part of the day that wasn't on the list.",
    "The project I've been talking about for weeks finally went out on Friday. I thought I'd feel like celebrating. Mostly, I wanted to come home, make toast, and not look at a screen. So that's what I did.\n\nSaturday morning was the first time in a while that I didn't wake up thinking about a deadline. I cleaned the kitchen, called Mum, and found your jacket on the chair. Still here. Still borrowing it. Consider this your very overdue update on both things.",
    "A few more from the week, in no particular order. Swipe through; the jacket makes a second appearance.",
  ],
  photos: [
    { story: 0, src: "/postcard/dinner.jpg", caption: "Saturday, before everyone arrived. The table stayed like this for about three minutes." },
    { story: 1, src: "/postcard/thursday.jpg", caption: "Thursday's detour. No filter, just a very good hour to miss the bus." },
    { story: 2, src: "/postcard/left-out.jpg", caption: "Your jacket has officially become part of the furniture." },
    { story: 1, src: "/postcard/home.jpg", caption: "One last frame: the walk home, just before the streetlights took over." },
    // Story 3 reuses the photos to show the swipe stack (4+ photos on one story).
    { story: 3, src: "/postcard/thursday.jpg", caption: "Thursday, golden hour." },
    { story: 3, src: "/postcard/dinner.jpg", caption: "The table, before the chaos." },
    { story: 3, src: "/postcard/home.jpg", caption: "Streetlights on the way home." },
    { story: 3, src: "/postcard/left-out.jpg", caption: "The jacket, still here." },
  ],
  recs: [
    {
      title: "A book for your next train ride",
      body: "I picked up ||The Art of Noticing by Rob Walker||. It's full of little experiments in paying attention. Very much your kind of thing; I'll pass it on when I'm done.",
      url: "https://bookshop.org/search?keywords=The%20Art%20of%20Noticing%20Rob%20Walker",
    },
    {
      title: "The dinner playlist, again",
      body: "Your summer playlist made another appearance. The Al Green stretch is still the best part. Please add whatever you've been listening to lately.",
      url: "https://open.spotify.com/search/Al%20Green",
    },
  ],
  tip: "The bakery by the station sells yesterday's bread for half price after four. Toast fixes everything.",
  funFact: "The best part of the week was the part I didn't plan.",
  dates: [
    { label: "Your birthday, {name}", when: "Nov 2", note: "Dinner is on me. Pick somewhere you've been wanting to try." },
    { label: "Our next catch-up", when: "Nov 8", note: "Sunday coffee. I'll bring the book and, finally, your jacket." },
  ],
};

/** Indexes of the photos shown with story `index` (empty srcs skipped). */
export function storyPhotoIndexes(content: PostcardContent, index: number): number[] {
  const tagged = content.photos.some((photo) => photo.story !== undefined);
  return content.photos.flatMap((photo, i) =>
    photo.src.trim() && (tagged ? photo.story === index : i === index) ? [i] : []);
}

/** Fields the editor may never change, e.g. photo URLs come from the agent, not the browser. */
const LOCKED = new Set(["src", "url", "story"]);
const MAX_TEXT = 2000;

/**
 * Applies untrusted edits from the browser onto the stored content.
 * Only existing text fields change; the shape, array lengths, and locked fields always come from `stored`.
 */
export function applyEdits<T>(stored: T, incoming: unknown): T {
  if (typeof stored === "string") {
    return (typeof incoming === "string" ? incoming.slice(0, MAX_TEXT) : stored) as T;
  }
  if (Array.isArray(stored)) {
    const items = Array.isArray(incoming) ? incoming : [];
    return stored.map((item, i) => applyEdits(item, items[i])) as T;
  }
  if (stored && typeof stored === "object") {
    const fields = incoming && typeof incoming === "object" ? (incoming as Record<string, unknown>) : {};
    return Object.fromEntries(
      Object.entries(stored).map(([key, value]) => [key, LOCKED.has(key) ? value : applyEdits(value, fields[key])]),
    ) as T;
  }
  return stored;
}
