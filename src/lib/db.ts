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

export async function updatePostcardContent(editToken: string, content: PostcardContent): Promise<void> {
  await db().query(`update postcards set content = $2, updated_at = now() where edit_token = $1`, [editToken, content]);
}
