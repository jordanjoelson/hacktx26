-- Postcards table for the web app. Safe to re-run: psql "$DATABASE_URL" -f db/postcards.sql
-- Depends on `users` from agent/db/schema.sql (on the toni branch); merge the two files once the branches merge.

-- One postcard per recipient per week. Both tokens are secrets: anyone with a link can use it.
create table if not exists postcards (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id),   -- the sender
  week_start date not null,
  content    jsonb not null,                        -- PostcardContent, see src/lib/postcard.ts
  edit_token text not null unique,                  -- /edit/<token>: the sender previews and edits
  view_token text not null unique,                  -- /p/<token>: the recipient reads
  sent_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists postcards_user_week on postcards (user_id, week_start);
