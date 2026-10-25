// Per-sender memory: their name, recent conversation, and whether they've been sent the contact card.
// TODO(next milestone): keep this in Supabase; for now it resets when the process restarts.

export interface Turn {
  role: "user" | "assistant";
  content: string;
}

export interface UserState {
  name?: string;
  history: Turn[];
  introduced: boolean;
}

/** How many recent messages (both sides) Muse sees for context. */
const HISTORY_LIMIT = 12;

const users = new Map<string, UserState>();

export function getUser(id: string): UserState {
  let user = users.get(id);
  if (!user) {
    user = { history: [], introduced: false };
    users.set(id, user);
  }
  return user;
}

export function remember(user: UserState, role: Turn["role"], content: string): void {
  user.history.push({ role, content });
  if (user.history.length > HISTORY_LIMIT) user.history.splice(0, user.history.length - HISTORY_LIMIT);
}
