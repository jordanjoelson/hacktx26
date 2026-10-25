import { randomBytes } from "node:crypto";
import { db } from "./db";
import { museComplete } from "./muse";
import { SAMPLE_POSTCARD, type PostcardContent } from "./postcard";
import type { UserState } from "./users";

/** "recap" or "recap for Maya", on its own. */
export const RECAP_COMMAND = /^\s*recap(?:\s+for\s+(.{1,40}?))?\s*[.!?]*\s*$/i;

// Where edit links point. Set APP_URL to the deployed web app.
const APP_URL = (process.env.APP_URL ?? "http://localhost:3001").replace(/\/$/, "");

const PROMPT = `You write Lately postcards: a short, warm weekly recap that a person sends to someone they care about.
Write in first person as the sender, talking to the recipient. Use only details from the sender's messages below; never invent events, places, or people. If there isn't much, keep it short and honest.

Reply with JSON only (no code fences), exactly this shape:
{"stories": ["...", "...", "..."], "captions": ["...", "...", "...", "..."], "recs": [{"title": "...", "body": "..."}, {"title": "...", "body": "..."}], "tip": "...", "funFact": "..."}

- stories: 3 short paragraphs, 2 to 4 sentences each, about different parts of the week.
- captions: 4 photo captions, 1 to 3 words each.
- recs: 2 things the recipient would like, drawn from the week. Title is 1 to 3 words.
- tip: one short line of advice from the week.
- funFact: one playful observation about the week, under 12 words.
- Inside any string you may use: ==phrase== to highlight, ++phrase++ for a pink highlight, ~~phrase~~ to cross something out playfully. Use them sparingly.
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

/** Turns Muse's JSON into postcard content, falling back to empty text for anything missing or malformed. */
export function toContent(json: Record<string, unknown>, from: string, to: string): PostcardContent {
  const list = (key: string) => (Array.isArray(json[key]) ? (json[key] as unknown[]) : []);
  const stories = list("stories");
  const captions = list("captions");
  const recs = list("recs");
  return {
    from,
    to,
    stories: [0, 1, 2].map((i) => str(stories[i], "")),
    // shortcut: photo files aren't stored yet, so the sample photos stand in; swap in the user's media once it's uploaded.
    photos: SAMPLE_POSTCARD.photos.map((photo, i) => ({ src: photo.src, caption: str(captions[i], "") })),
    recs: [0, 1].map((i) => {
      const rec = recs[i] && typeof recs[i] === "object" ? (recs[i] as Record<string, unknown>) : {};
      return { title: str(rec.title, ""), body: str(rec.body, "") };
    }),
    tip: str(json.tip, ""),
    funFact: str(json.funFact, ""),
    dates: [],
  };
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

  const text = await museComplete(
    "recap",
    [
      { role: "system", content: PROMPT },
      { role: "user", content: `The sender's messages this week, oldest first:\n\n${notes.join("\n---\n")}` },
    ],
    { timeoutMs: 45_000, maxTokens: 4096 },
  );
  const json = text === undefined ? undefined : parseJSON(text);
  if (!json) return "I couldn't put your recap together just now. Text recap to try again.";

  const to = recipient?.trim() || "you";
  const content = toContent(json, user.name ?? "me", to);
  const editToken = randomBytes(16).toString("base64url");
  await db.query(
    `insert into postcards (user_id, week_start, content, edit_token, view_token)
     values ($1, date_trunc('week', now())::date, $2, $3, $4)`,
    [user.id, content, editToken, randomBytes(16).toString("base64url")],
  );

  const forWhom = recipient ? ` for ${to}` : "";
  return `Your recap${forWhom} is ready ✨ Tap to read it over, change anything, and send it: ${APP_URL}/edit/${editToken}`;
}
