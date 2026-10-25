// Creates a sample postcard and prints its edit and view links.
// Run with: npm run seed
import { randomBytes } from "node:crypto";
import pg from "pg";
import { SAMPLE_POSTCARD } from "../src/lib/postcard.ts";
import { TIGER_CA } from "../src/lib/tiger-ca.ts";

const url = new URL(process.env.DATABASE_URL ?? "");
url.searchParams.delete("sslmode");
const db = new pg.Client({ connectionString: url.toString(), ssl: { ca: TIGER_CA } });
const token = () => randomBytes(16).toString("base64url");

await db.connect();
try {
  const { rows: [user] } = await db.query<{ id: string }>(
    `insert into users (sender_id, name) values ('seed-demo', 'Jordan')
     on conflict (sender_id) do update set name = excluded.name returning id`,
  );
  const editToken = token();
  const viewToken = token();
  await db.query(
    `insert into postcards (user_id, week_start, content, edit_token, view_token)
     values ($1, date_trunc('week', now())::date, $2, $3, $4)`,
    [user!.id, SAMPLE_POSTCARD, editToken, viewToken],
  );
  const base = process.env.APP_URL ?? "http://localhost:3000";
  console.log(`Edit: ${base}/edit/${editToken}`);
  console.log(`View: ${base}/p/${viewToken}`);
} finally {
  await db.end();
}
