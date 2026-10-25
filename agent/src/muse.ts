import { config } from "./config";
import type { UserState } from "./users";

const ENDPOINT = "https://api.meta.ai/v1/chat/completions";
const MODEL = "muse-spark-1.3";
// Past this, the caller falls back to a canned reply so the user is never left waiting.
const TIMEOUT_MS = 8000;

const PERSONA = `You are Lately, a friendly companion people text over iMessage about their week. They send you photos, videos, and notes, and at the end of the week you turn them into a recap.

Write like a close friend texting back:
- 1 or 2 short sentences, under 40 words. Plain text only: no markdown, lists, or quotes around the reply.
- Warm, casual, and genuine. At most one emoji. Never use heart emojis.
- React to the specifics of what they said. Celebrate good news. If something is hard, be gentle and supportive; don't lecture or try to fix it.
- Sometimes ask a light follow-up question, but not every time.
- You can't see photos or videos yet, make plans, or set reminders, so never claim to.
- If someone mentions self-harm or being in danger, respond with care and encourage them to reach out to someone they trust or call or text 988 (US).`;

function nameInstructions(name: string | undefined): string {
  if (name) {
    return `The user's name is ${name}. Use it now and then, naturally, not in every message.`;
  }
  return `You don't know the user's name yet. Unless the conversation shows you already asked, end your reply by casually asking what you should call them.`;
}

const NAME_FORMAT = `If the user's latest message tells you their name, write "NAME: <their first name>" on the first line, then your reply on the next line. Otherwise write only the reply.`;

export interface MuseResult {
  reply: string;
  /** Set when the user just told us their name. */
  name?: string;
}

interface ChatCompletion {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

function parse(content: string): MuseResult | undefined {
  const match = /^\s*NAME:\s*([^\n]+)\n+([\s\S]*)$/i.exec(content);
  const reply = (match ? match[2]! : content).trim();
  if (!reply) return undefined;

  const name = match?.[1]!.replace(/[^\p{L}\p{M}' -]/gu, "").trim().slice(0, 30);
  return { reply, name: name || undefined };
}

/**
 * Asks Muse Spark for a reply to the user's latest text, with their recent history for context.
 * Returns undefined on any failure or timeout; the caller falls back to a canned reply.
 */
export async function museReply(user: UserState, latest: string): Promise<MuseResult | undefined> {
  const started = Date.now();
  try {
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.MUSE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        // "minimal" replied in ~1.5 s vs ~3.3 s for "low" in testing, with replies just as good.
        reasoning_effort: "minimal",
        // Reasoning tokens count toward this cap too, so leave room beyond the short reply.
        max_completion_tokens: 1024,
        messages: [
          { role: "system", content: `${PERSONA}\n\n${nameInstructions(user.name)}\n\n${NAME_FORMAT}` },
          ...user.history,
          { role: "user", content: latest },
        ],
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!res.ok) {
      console.error(`  muse error ${res.status}: ${(await res.text()).slice(0, 300)}`);
      return undefined;
    }

    const data = (await res.json()) as ChatCompletion;
    const { prompt_tokens = 0, completion_tokens = 0 } = data.usage ?? {};
    console.log(`  muse: ${Date.now() - started} ms, ${prompt_tokens} in / ${completion_tokens} out tokens`);

    return parse(data.choices?.[0]?.message?.content ?? "");
  } catch (err) {
    const reason = err instanceof Error && err.name === "TimeoutError" ? `timed out after ${TIMEOUT_MS} ms` : err;
    console.error(`  muse failed:`, reason);
    return undefined;
  }
}
