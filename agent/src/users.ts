// Per-sender memory: their name, recent conversation, and whether they've been sent the contact card.
// Stored in Tiger Cloud (see db/schema.sql), so it survives restarts.
import { db } from "./db";
import type { MediaItem } from "./handler";

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

export interface UserState {
  id: string;
  name?: string;
  history: Turn[];
  introduced: boolean;
  /** A recap they asked for before telling us their name: who it's for ("" = nobody named). */
  pendingRecapFor?: string;
}

/** How many recent messages (both sides) Muse sees for context. */
const HISTORY_LIMIT = 12;

/** Loads a sender (creating them on first contact) with their last HISTORY_LIMIT messages. */
export async function getUser(senderId: string): Promise<UserState> {
  const { rows: [row] } = await db.query<{
    id: string;
    name: string | null;
    introduced: boolean;
    pending_recap_for: string | null;
  }>(
    `insert into users (sender_id) values ($1)
     on conflict (sender_id) do update set sender_id = excluded.sender_id
     returning id, name, introduced_at is not null as introduced, pending_recap_for`,
    [senderId],
  );
  const user = row!;

  const { rows: history } = await db.query<Turn>(
    `select role, content from (
       select role, content, id from messages where user_id = $1 order by id desc limit $2
     ) recent order by id`,
    [user.id, HISTORY_LIMIT],
  );

  return {
    id: user.id,
    name: user.name ?? undefined,
    introduced: user.introduced,
    pendingRecapFor: user.pending_recap_for ?? undefined,
    history,
  };
}

/** Remembers (or clears, with undefined) a recap to make once we learn their name. */
export async function setPendingRecap(user: UserState, forWhom: string | undefined): Promise<void> {
  user.pendingRecapFor = forWhom;
  await db.query(`update users set pending_recap_for = $2 where id = $1`, [user.id, forWhom ?? null]);
}

export async function remember(
  user: UserState,
  role: Turn["role"],
  content: string,
  spectrumId?: string,
): Promise<void> {
  await db.query(
    `insert into messages (user_id, role, content, spectrum_id) values ($1, $2, $3, $4)`,
    [user.id, role, content, spectrumId ?? null],
  );
  user.history.push({ role, content });
  if (user.history.length > HISTORY_LIMIT) user.history.splice(0, user.history.length - HISTORY_LIMIT);
}

export async function saveName(user: UserState, name: string): Promise<void> {
  user.name = name;
  await db.query(`update users set name = $2 where id = $1`, [user.id, name]);
}

export async function markIntroduced(user: UserState): Promise<void> {
  user.introduced = true;
  await db.query(`update users set introduced_at = now() where id = $1`, [user.id]);
}

/** Saves a photo/video's metadata. The file itself isn't uploaded yet, so storage_url stays null. */
export async function saveMedia(user: UserState, spectrumId: string, item: MediaItem): Promise<void> {
  await db.query(
    `insert into media (user_id, spectrum_id, kind, name, mime_type, size_bytes) values ($1, $2, $3, $4, $5, $6)`,
    [user.id, spectrumId, item.kind, item.name, item.mimeType, item.attachment.size ?? null],
  );
}
