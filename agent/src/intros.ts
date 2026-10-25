import { imessage } from "spectrum-ts/providers/imessage";
import { db } from "./db";
import type { App } from "./handler";
import { getUser, remember } from "./users";

/** How often to check for new homepage sign-ups. */
const POLL_MS = 5000;

const HELLO =
  "Hey, it's Lately 👋 Text me photos, videos, and notes from your week, and I'll turn them into a recap for your people. What should I call you?";

/** Texts hello to every number queued from the homepage. Each row is claimed before sending, so it's never sent twice. */
async function sendPending(app: App): Promise<void> {
  const { rows } = await db.query<{ id: string; phone: string }>(
    `update intros set sent_at = now()
     where id in (select id from intros where sent_at is null order by id limit 10 for update skip locked)
     returning id, phone`,
  );

  for (const { id, phone } of rows) {
    try {
      const space = await imessage(app).space.create(phone);
      await space.send(HELLO);
      // Saved as Lately's first turn, so Muse knows it already asked for their name.
      await remember(await getUser(phone), "assistant", HELLO);
      console.log(`${new Date().toISOString()} ${phone} intro sent`);
    } catch (err) {
      console.error(`  failed to send intro to ${phone}:`, err);
      await db.query(`update intros set error = $2 where id = $1`, [id, String(err)]).catch(() => {});
    }
  }
}

/** Polls for sign-ups forever. A failed poll is logged and retried on the next tick. */
export function startIntros(app: App): void {
  const tick = () => {
    sendPending(app)
      .catch((err) => console.error("intro poll failed:", err))
      .finally(() => setTimeout(tick, POLL_MS));
  };
  tick();
}
