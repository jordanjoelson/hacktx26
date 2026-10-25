import { randomBytes } from "node:crypto";
import { APP_URL } from "./config";
import { db } from "./db";
import { museComplete } from "./muse";
import { SAMPLE_POSTCARD, type PostcardContent, type PostcardPhoto } from "./postcard";
import type { UserState } from "./users";

/** "recap" or "recap for Maya", on its own. */
export const RECAP_COMMAND = /^\s*recap(?:\s+for\s+(.{1,40}?))?\s*[.!?]*\s*$/i;

const PROMPT = `You write Lately postcards: a short, warm weekly recap that a person sends to someone they care about.
Write in first person as the sender, talking to the recipient. Use only details from the sender's messages below; never invent events, places, or people. If there isn't much, keep it short and honest.

Reply with JSON only (no code fences), exactly this shape:
{"title": "...", "intro": "...", "opener": "...", "celebrate": false, "storyTitles": ["...", "...", "..."], "stories": ["...", "...", "..."], "captions": ["...", "...", "...", "..."], "photoGroups": [{"story": 0, "caption": "..."}], "recs": [{"title": "...", "body": "...", "kind": "book", "query": "..."}, {"title": "...", "body": "...", "kind": "place", "query": "..."}], "tip": "...", "funFact": "..."}

- title: a natural headline for this particular week, under 10 words. Avoid generic self-help language.
- intro: one sentence that introduces the week's actual moments, without repeating the headline.
- opener: one short, playful line that opens the recap, tied to something real from the week (a light joke, a fun teaser, a wink at what's coming). It must not ask the recipient anything or expect a reply. Keep it under 20 words. If the week was hard, make it gentle and warm instead of a joke.
- storyTitles: 3 short, specific headings, one for each story. Do not invent details for a heading.
- stories: 3 short paragraphs, 2 to 4 sentences each, about different parts of the week.
- captions: 4 photo captions, 1 to 3 words each.
- celebrate: true only if the week has clearly good news worth celebrating (a win, a birthday, a new job, an engagement, finishing something big). Otherwise false.
- photoGroups: only if photo groups are listed below, one entry per group in the same order. story is the index (0, 1, or 2) of the story it fits best, using the text sent with it and the timing; caption is 2 to 8 words. Leave it [] if no groups are listed.
- recs: 2 things the recipient would like, drawn from the week. Title is 1 to 3 words. kind is one of book, place, food, music, show, movie, other. query is what you'd type into a search box to find it (for a book, the title and author).
- tip: one short line of advice from the week.
- funFact: one playful observation about the week, under 12 words.
- Inside any string you may use: ==phrase== to highlight, ++phrase++ for a pink highlight, ~~phrase~~ to cross something out playfully, ||phrase|| to hide a fun reveal until it's tapped (like a spoiler). Use them sparingly.
- Write {name} wherever you'd say the recipient's name.`;

function str(value: unknown, fallback: string): string {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 2000) : fallback;
}

/** Strips ```json fences some models add despite instructions. */
function parseJSON(text: string): Record<string, unknown> | undefined {
  try {
    const parsed: unknown = JSON.parse(text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ""));
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : undefined;
  } catch {
    return undefined;
  }
}

// Search pages by rec kind: reliable links without a search API. Anything else falls back to a web search.
const SEARCH: Record<string, (query: string) => string> = {
  book: (q) => `https://bookshop.org/search?keywords=${q}`,
  place: (q) => `https://www.google.com/maps/search/?api=1&query=${q}`,
  food: (q) => `https://www.google.com/maps/search/?api=1&query=${q}`,
  music: (q) => `https://open.spotify.com/search/${q}`,
  show: (q) => `https://www.justwatch.com/us/search?q=${q}`,
  movie: (q) => `https://www.justwatch.com/us/search?q=${q}`,
};

export function recUrl(kind: unknown, query: unknown): string | undefined {
  if (typeof query !== "string" || !query.trim()) return undefined;
  const q = encodeURIComponent(query.trim().slice(0, 120));
  const search = typeof kind === "string" ? SEARCH[kind.toLowerCase()] : undefined;
  return search ? search(q) : `https://www.google.com/search?q=${q}`;
}

/** Photos sent in one message: they stay together, and Muse picks which story they belong to. */
export interface PhotoGroup {
  srcs: string[];
  context: string;
}

/** Turns Muse's JSON into postcard content, falling back to empty text for anything missing or malformed. */
export function toContent(
  json: Record<string, unknown>,
  from: string,
  to: string,
  groups: PhotoGroup[] = [],
): PostcardContent {
  const list = (key: string) => (Array.isArray(json[key]) ? (json[key] as unknown[]) : []);
  const stories = list("stories");
  const captions = list("captions");
  const recs = list("recs");
  return {
    from,
    to,
    title: str(json.title, "A little of life, lately."),
    intro: str(json.intro, ""),
    opener: str(json.opener, ""),
    celebrate: json.celebrate === true,
    storyTitles: [0, 1, 2].map((i) => str(list("storyTitles")[i], "")),
    stories: [0, 1, 2].map((i) => str(stories[i], "")),
    photos: groups.length > 0
      ? groupedPhotos(groups, list("photoGroups"))
      // shortcut: no photos this week (or none stored yet), so the sample photos stand in, one per story.
      : SAMPLE_POSTCARD.photos.map((photo, i) => ({ src: photo.src, caption: str(captions[i], "") })),
    recs: [0, 1].map((i) => {
      const rec = recs[i] && typeof recs[i] === "object" ? (recs[i] as Record<string, unknown>) : {};
      const url = recUrl(rec.kind, rec.query);
      return { title: str(rec.title, ""), body: str(rec.body, ""), ...(url ? { url } : {}) };
    }),
    tip: str(json.tip, ""),
    funFact: str(json.funFact, ""),
    dates: [],
  };
}

/** One photo per src, tagged with the story Muse chose for its group (story 0 if Muse skipped it). */
function groupedPhotos(groups: PhotoGroup[], assigned: unknown[]): PostcardPhoto[] {
  return groups.flatMap((group, g) => {
    const pick = assigned[g] && typeof assigned[g] === "object" ? (assigned[g] as Record<string, unknown>) : {};
    const story = typeof pick.story === "number" && pick.story >= 0 && pick.story <= 2 ? Math.floor(pick.story) : 0;
    return group.srcs.map((src) => ({ src, caption: str(pick.caption, ""), story }));
  });
}

/** This week's photos, grouped by the message they came in, with the text sent alongside. */
async function photoGroups(userId: string): Promise<PhotoGroup[]> {
  const { rows } = await db.query<{ spectrum_id: string | null; storage_url: string | null; context: string | null }>(
    `select m.spectrum_id, m.storage_url, msg.content as context
     from media m
     left join messages msg on msg.spectrum_id = m.spectrum_id and msg.role = 'user'
     where m.user_id = $1 and m.kind = 'photo' and m.created_at >= date_trunc('week', now())
     order by m.id`,
    [userId],
  );
  const groups = new Map<string, PhotoGroup>();
  rows.forEach((row, i) => {
    const key = row.spectrum_id ?? `photo-${i}`;
    const group = groups.get(key) ?? { srcs: [], context: row.context ?? "" };
    // shortcut: files aren't uploaded yet (storage_url is null), so sample photos stand in until media storage exists.
    group.srcs.push(row.storage_url ?? SAMPLE_POSTCARD.photos[i % SAMPLE_POSTCARD.photos.length]!.src);
    groups.set(key, group);
  });
  return [...groups.values()];
}

/**
 * Writes this week's postcard from the user's messages and returns the text to send back:
 * the edit link, or why there's nothing to recap.
 */
export async function createRecap(user: UserState, recipient: string | undefined): Promise<string> {
  const { rows } = await db.query<{ content: string }>(
    `select content from messages
     where user_id = $1 and role = 'user' and created_at >= date_trunc('week', now())
     order by id`,
    [user.id],
  );
  const notes = rows.map((row) => row.content).filter((text) => !RECAP_COMMAND.test(text));
  if (notes.length === 0) {
    return "Nothing to recap yet this week. Send me a few photos or notes about your week, then text recap.";
  }

  const groups = await photoGroups(user.id);
  const groupList = groups.length
    ? `\n\nPhoto groups (photos sent together), in order:\n${groups
        .map((g, i) => `${i + 1}. ${g.srcs.length} photo${g.srcs.length === 1 ? "" : "s"}, sent with: ${g.context.trim() || "(no text)"}`)
        .join("\n")}`
    : "\n\nNo photo groups this week.";
  const text = await museComplete(
    "recap",
    [
      { role: "system", content: PROMPT },
      { role: "user", content: `The sender's messages this week, oldest first:\n\n${notes.join("\n---\n")}${groupList}` },
    ],
    { timeoutMs: 45_000, maxTokens: 4096 },
  );
  const json = text === undefined ? undefined : parseJSON(text);
  if (!json) return "I couldn't put your recap together just now. Text recap to try again.";

  const to = recipient?.trim() || "you";
  const content = toContent(json, user.name ?? "me", to, groups);
  const editToken = randomBytes(16).toString("base64url");
  await db.query(
    `insert into postcards (user_id, week_start, content, edit_token, view_token)
     values ($1, date_trunc('week', now())::date, $2, $3, $4)`,
    [user.id, content, editToken, randomBytes(16).toString("base64url")],
  );

  const forWhom = recipient ? ` for ${to}` : "";
  return `Your recap${forWhom} is ready ✨ Tap to read it over, change anything, and send it: ${APP_URL}/edit/${editToken}`;
}
