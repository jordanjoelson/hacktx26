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
  /** Optional editorial fields; older recaps still render without them. */
  title?: string;
  intro?: string;
  period?: string;
  storyTitles?: string[];
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
  title: "Good food.\nBetter company.",
  intro: "A dinner that ran late, the long way home, and a small win I've been meaning to tell you about.",
  period: "October 19–25, 2026",
  storyTitles: ["Nobody left at nine.", "The long way was the good way.", "Finally, a little room to breathe."],
  stories: [
    "I invited a few people over on Saturday with the very ambitious promise of dinner at seven. We ate at eight. The pasta needed rescuing, Sam brought enough bread for a small village, and somebody put on the playlist you made last summer.\n\nI kept thinking we'd clear the plates and call it a night. Instead, we opened the windows, made another pot of coffee, and stayed at the table until almost midnight. No occasion. No particularly good reason. Just one of those nights that feels better than anything you could have planned.\n\nYou would've loved it, {name}. Next time, that empty place is yours.",
    "On Thursday I missed my bus and decided to walk instead of waiting for the next one. It added forty minutes to the trip, which turned out to be exactly what I needed.\n\nThe trees have finally gone gold. I found a tiny bookstore with a whole shelf of books about places neither of us has been, bought one I absolutely didn't need, and sat outside until the light started to go.\n\nI'm trying to do more of that. Leave a little space for the part of the day that wasn't on the list.",
    "The project I've been talking about for weeks finally went out on Friday. I thought I'd feel like celebrating. Mostly, I wanted to come home, make toast, and not look at a screen. So that's what I did.\n\nSaturday morning was the first time in a while that I didn't wake up thinking about a deadline. I cleaned the kitchen, called Mum, and found your jacket on the chair. Still here. Still borrowing it. Consider this your very overdue update on both things.",
  ],
  photos: [
    { src: "/postcard/dinner.jpg", caption: "Saturday, before everyone arrived. The table stayed like this for about three minutes." },
    { src: "/postcard/thursday.jpg", caption: "Thursday's detour. No filter, just a very good hour to miss the bus." },
    { src: "/postcard/left-out.jpg", caption: "Your jacket has officially become part of the furniture." },
    { src: "/postcard/home.jpg", caption: "One last frame: the walk home, just before the streetlights took over." },
  ],
  recs: [
    {
      title: "A book for your next train ride",
      body: "I picked up The Art of Noticing by Rob Walker. It's full of little experiments in paying attention. Very much your kind of thing; I'll pass it on when I'm done.",
    },
    {
      title: "The dinner playlist, again",
      body: "Your summer playlist made another appearance. The Al Green stretch is still the best part. Please add whatever you've been listening to lately.",
    },
  ],
  tip: "The bakery by the station sells yesterday's bread for half price after four. Toast fixes everything.",
  funFact: "The best part of the week was the part I didn't plan.",
  dates: [
    { label: "Your birthday, {name}", when: "Nov 2", note: "Dinner is on me. Pick somewhere you've been wanting to try." },
    { label: "Our next catch-up", when: "Nov 8", note: "Sunday coffee. I'll bring the book and, finally, your jacket." },
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
