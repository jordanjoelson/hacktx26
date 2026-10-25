// Postcard content: one person's weekly postcard, stored as JSON in postcards.content.
// Text fields support ==highlight==, ++pink highlight++, ~~cross out~~, and {name} for the recipient.
// Shared with the web app (src/lib/postcard.ts re-exports it), so keep it free of imports and path aliases.

export interface PostcardPhoto {
  src: string;
  caption: string;
}

export interface PostcardRec {
  title: string;
  body: string;
}

export interface PostcardDate {
  label: string;
  when: string;
  note: string;
}

export interface PostcardContent {
  from: string;
  to: string;
  stories: string[];
  photos: PostcardPhoto[];
  recs: PostcardRec[];
  tip: string;
  funFact: string;
  dates: PostcardDate[];
}

export const SAMPLE_POSTCARD: PostcardContent = {
  from: "Jordan",
  to: "Maya",
  stories: [
    "{name}, the week was mostly ==walking== and one long dinner. I almost ~~left it out~~, then ++kept it++ because you would have asked. This is the short version, the one you can read on a train. The part I still have is the walk after, when it got quiet. You stopped at every window. I kept the pace, which is the opposite of how this usually goes.",
    "The project finally moved. You asked last time, {name}, so here it is ++without the spiral++. I still don't know what ~~Friday~~ was for. It can stay that way. The jacket is still on the chair, which is the part I didn't text.",
    "Empty street. I almost sent this from the sidewalk, then ~~didn't~~. It's here instead, {name}. The lamp was already on. You would have asked which block, and I still wouldn't have had a good answer.",
  ],
  photos: [
    { src: "/postcard/thursday.jpg", caption: "Thursday" },
    { src: "/postcard/dinner.jpg", caption: "The dinner" },
    { src: "/postcard/left-out.jpg", caption: "Left out" },
    { src: "/postcard/home.jpg", caption: "On the way home" },
  ],
  recs: [
    {
      title: "Bookstore",
      body: "You'd like the corner bookstore. You both stopped, and you stayed longer than you meant to. Go back on a ==weekday==, before the tables fill. There's a chair by the window you would take without asking.",
    },
    {
      title: "Early show",
      body: "You'll go if it isn't a whole night. I'll get the tickets.",
    },
  ],
  tip: "==Go early==. The good bread is gone by ten.",
  funFact: "You walk faster when you're talking.",
  dates: [
    { label: "{name}'s birthday", when: "Jun 14", note: "Saved. You usually send {name} something small." },
    { label: "Sam", when: "Mar 3", note: "You flagged this for {name} too." },
    { label: "Alex", when: "Nov 19", note: "{name} was there last year." },
  ],
};

/** Fields the editor may never change, e.g. photo URLs come from the agent, not the browser. */
const LOCKED = new Set(["src"]);
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
