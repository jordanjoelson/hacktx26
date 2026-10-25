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
  from: "Toni",
  to: "Maya",
  title: "Won one.\nWalked into the next.",
  intro: "A Texas Tech win, a rainbow on a walk, and the first night of HackTX.",
  celebrate: true,
  opener: "Starts with a gold pin. Ends with naan on a paper plate.",
  period: "October 19–25, 2026",
  storyTitles: ["Four of us, and the pin.", "Then I went outside.", "The hall, the plate, the table.", "HackTX, starting soon."],
  stories: [
    "We won a Texas Tech hackathon. This is right after: the four of us, holding the Samsung monitors like trophies. One of them was still in the box. We were too busy smiling to care.\n\nThe pin is gold and shaped like a gear. ==HACKATHON WINNER==, MLH across the bottom. I held it in my palm longer than I needed to. {name}, I've wanted one of these for a while, and it feels exactly as heavy as it should.",
    "Then I left the building. On a walk the sky put up a full rainbow over the towers, and I stopped. You would have too.\n\nI spent an afternoon at the range, ear protection on, brass on the floor. Later I got back on the bouldering wall: arms out, chalk on the holds, one move from looking like I meant it. The week needed the parts that weren't a laptop.",
    "I sat with my family at the symphony. Big room, the orchestra under the lights, a screen waiting behind them. Nobody in our row was in a hurry. I'll remember that longer than the pin.\n\nBreakfast was the responsible one. Eggs, avocado toast, two sausage patties, pepper on everything. I made it, and then I actually ate it.\n\nDinner with friends was a table of sushi that did not stay full. Orange booths, too many plates, the good kind of loud. You would have taken the salmon.",
    "Then it was HackTX. Opening ceremony, Freetail Hackers on a screen the size of the wall, ==Starting Soon== in the middle of a very fancy hall. I was in the seats with everyone else. That's the right place to be the night before you build.\n\nThe food came later, and it was the surprise. Indian, on a paper plate: naan, two curries, and something red and fried. Hackathon food is usually a compromise. ++This one wasn't.++",
  ],
  photos: [
    { story: 0, src: "/week/IMG_0617.jpeg", caption: "Right after. Four of us, four monitors, one very good night." },
    { story: 0, src: "/week/IMG_3353.jpeg", caption: "The pin. I held it longer than I needed to." },
    { story: 1, src: "/week/IMG_3446.jpeg", caption: "Stopped the walk for this. Worth it." },
    { story: 3, src: "/week/IMG_3789.jpeg", caption: "HackTX opening. Starting soon." },
    { story: 2, src: "/week/IMG_3667.jpeg", caption: "Symphony with my family. The quiet kind of good." },
    { story: 1, src: "/week/IMG_3621.jpeg", caption: "Range day. Ear protection on." },
    { story: 1, src: "/week/IMG_3744.jpeg", caption: "Back on the wall. Chalk everywhere." },
    { story: 2, src: "/week/IMG_3682.jpeg", caption: "Breakfast I actually made. Eggs, avocado, the works." },
    { story: 2, src: "/week/IMG_3780.jpeg", caption: "Dinner with friends. The table did not stay full." },
    { story: 3, src: "/week/IMG_3798.jpeg", caption: "HackTX dinner. Naan, two curries, no regrets." },
  ],
  recs: [
    {
      title: "Oumi",
      body: "The sushi dinner. Go hungry. The table fills up faster than you think, and the salmon is the one to fight for.",
      url: "https://www.google.com/maps/search/?api=1&query=Oumi%20sushi%20grill%20bar",
    },
    {
      title: "A walk after rain",
      body: "If the light goes gold and there's a rainbow, stop. Take the photo. Whatever you're late for will still be there.",
    },
  ],
  tip: "The best meal of a hackathon might be on a paper plate. Don't skip it.",
  funFact: "The pin is heavier than it looks.",
  dates: [
    { label: "HackTX", when: "This weekend", note: "Opening night is done. I'll tell you what we build once we've slept." },
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
