import { randomBytes } from "node:crypto";
import pg from "pg";
import type { PostcardContent } from "./postcard";
import { TIGER_CA } from "./tiger-ca";

// pg lets ?sslmode= in the URL override the `ssl` option, so drop it and verify against Timescale's CA.
function connectionString(): string {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("Missing env var DATABASE_URL (set it in .env.local)");
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  return url.toString();
}

// Created on first use (so builds don't need DATABASE_URL) and reused across dev hot reloads.
const globalForDb = globalThis as unknown as { db?: pg.Pool };
function db(): pg.Pool {
  return (globalForDb.db ??= new pg.Pool({ connectionString: connectionString(), ssl: { ca: TIGER_CA } }));
}

export interface Postcard {
  content: PostcardContent;
  viewToken: string;
}

export async function getPostcardByEditToken(token: string): Promise<Postcard | undefined> {
  const { rows } = await db().query<{ content: PostcardContent; view_token: string }>(
    `select content, view_token from postcards where edit_token = $1`,
    [token],
  );
  return rows[0] && { content: rows[0].content, viewToken: rows[0].view_token };
}

export async function getPostcardByViewToken(token: string): Promise<PostcardContent | undefined> {
  const { rows } = await db().query<{ content: PostcardContent }>(
    `select content from postcards where view_token = $1`,
    [token],
  );
  return rows[0]?.content;
}

export interface SendInfo {
  inviteCode: string;
  subscribers: number;
  sent: boolean;
}

/** What the edit page's Send panel needs. Creates the sender's invite code the first time. */
export async function getSendInfo(editToken: string): Promise<SendInfo | undefined> {
  const { rows } = await db().query<{ invite_code: string; subscribers: number; sent: boolean }>(
    `with p as (select user_id, sent_at from postcards where edit_token = $1)
     update users u set invite_code = coalesce(u.invite_code, $2)
     from p where u.id = p.user_id
     returning u.invite_code,
               p.sent_at is not null as sent,
               (select count(*) from subscribers s where s.sender_id = u.id)::int as subscribers`,
    [editToken, randomBytes(6).toString("base64url")],
  );
  const row = rows[0];
  return row && { inviteCode: row.invite_code, subscribers: row.subscribers, sent: row.sent };
}

/** The name behind an invite code, or undefined if the code doesn't exist. Null name = they never told Lately. */
export async function getInviter(code: string): Promise<{ name: string | null } | undefined> {
  const { rows } = await db().query<{ name: string | null }>(`select name from users where invite_code = $1`, [code]);
  return rows[0];
}

/** Marks the postcard sent; the agent then texts it to the sender's subscribers. False if it was already sent. */
export async function markPostcardSent(editToken: string): Promise<boolean> {
  const { rowCount } = await db().query(
    `update postcards set sent_at = now() where edit_token = $1 and sent_at is null`,
    [editToken],
  );
  return rowCount === 1;
}

export async function updatePostcardContent(editToken: string, content: PostcardContent): Promise<void> {
  await db().query(`update postcards set content = $2, updated_at = now() where edit_token = $1`, [editToken, content]);
}
