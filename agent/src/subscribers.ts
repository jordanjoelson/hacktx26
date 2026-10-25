import { imessage } from "spectrum-ts/providers/imessage";
import { APP_URL } from "./config";
import { db } from "./db";
import type { App } from "./handler";
import type { UserState } from "./users";

/** The opt-in text the /j/<code> page types out, e.g. "Hi Lately! Sign me up for Jordan's recaps (code: Ab3dE9xY)". */
export const SUBSCRIBE_TEXT = /\(code:?\s*([\w-]{6,16})\)/i;

/** How often to check for recaps whose sender tapped Send. */
const POLL_MS = 5000;

/** Links this user to the sender behind the invite code and returns the reply. */
export async function subscribe(user: UserState, code: string): Promise<string> {
  const { rows: [sender] } = await db.query<{ id: string; name: string | null }>(
    `select id, name from users where invite_code = $1`,
    [code],
  );
  if (!sender) return "Hmm, I couldn't find whose recaps those are. Ask them to send their link again?";
  if (sender.id === user.id) return "That's your own link! Share it with your people so they can get your recaps.";

  await db.query(
    `insert into subscribers (sender_id, subscriber_id) values ($1, $2) on conflict do nothing`,
    [sender.id, user.id],
  );
  console.log(`  subscribed to ${sender.name ?? sender.id}`);

  const who = sender.name ?? "your friend";
  const { rows: [latest] } = await db.query<{ view_token: string }>(
    `select view_token from postcards where user_id = $1 and sent_at is not null order by sent_at desc limit 1`,
    [sender.id],
  );
  return latest
    ? `You're in! Here's ${who}'s latest recap 💌 ${APP_URL}/p/${latest.view_token}`
    : `You're in! I'll text you ${who}'s next recap as soon as it's ready.`;
}

/** Texts each newly sent recap to its sender's subscribers, then tells the sender. Each postcard is claimed once. */
async function deliverPending(app: App): Promise<void> {
  const { rows } = await db.query<{ id: string; user_id: string; view_token: string }>(
    `update postcards set delivered_at = now()
     where id in (
       select id from postcards where sent_at is not null and delivered_at is null
       order by id limit 5 for update skip locked
     )
     returning id, user_id, view_token`,
  );

  for (const postcard of rows) {
    const { rows: [sender] } = await db.query<{ name: string | null; sender_id: string }>(
      `select name, sender_id from users where id = $1`,
      [postcard.user_id],
    );
    const { rows: subs } = await db.query<{ phone: string }>(
      `select u.sender_id as phone from subscribers s join users u on u.id = s.subscriber_id where s.sender_id = $1`,
      [postcard.user_id],
    );

    const who = sender?.name ?? "Your friend";
    let delivered = 0;
    for (const { phone } of subs) {
      try {
        const space = await imessage(app).space.create(phone);
        await space.send(`${who}'s recap is here 💌 ${APP_URL}/p/${postcard.view_token}`);
        delivered++;
      } catch (err) {
        console.error(`  failed to deliver recap ${postcard.id} to ${phone}:`, err);
      }
    }
    console.log(`${new Date().toISOString()} recap ${postcard.id} delivered to ${delivered}/${subs.length}`);

    if (sender) {
      try {
        const space = await imessage(app).space.create(sender.sender_id);
        await space.send(`Sent your recap to ${delivered} ${delivered === 1 ? "person" : "people"} ✓`);
      } catch (err) {
        console.error(`  failed to confirm delivery to sender:`, err);
      }
    }
  }
}

/** Polls for sent recaps forever. A failed poll is logged and retried on the next tick. */
export function startDeliveries(app: App): void {
  const tick = () => {
    deliverPending(app)
      .catch((err) => console.error("delivery poll failed:", err))
      .finally(() => setTimeout(tick, POLL_MS));
  };
  tick();
}
