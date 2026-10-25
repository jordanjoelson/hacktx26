-- Lately agent schema. Safe to re-run: psql "$DATABASE_URL" -f db/schema.sql

-- One row per iMessage sender.
create table if not exists users (
  id            bigint generated always as identity primary key,
  sender_id     text not null unique,         -- message.sender.id from Spectrum
  name          text,                         -- learned by Muse ("NAME: ...")
  introduced_at timestamptz,                  -- when the contact card was sent; null = not yet
  created_at    timestamptz not null default now()
);

-- Conversation log; Muse sees each user's most recent rows.
create table if not exists messages (
  id          bigint generated always as identity primary key,
  user_id     bigint not null references users(id),
  role        text not null check (role in ('user', 'assistant')),
  content     text not null,                  -- what Muse sees, e.g. "had tacos\n[sent 2 photos]"
  spectrum_id text,                           -- message.id of the inbound message
  created_at  timestamptz not null default now()
);
create index if not exists messages_user_time on messages (user_id, created_at desc);

-- Photos and videos sent in. Metadata only; the file itself goes to object storage later.
create table if not exists media (
  id          bigint generated always as identity primary key,
  user_id     bigint not null references users(id),
  spectrum_id text,                           -- message.id it arrived with
  kind        text not null check (kind in ('photo', 'video')),
  name        text not null,
  mime_type   text not null,
  size_bytes  bigint,
  storage_url text,                           -- null until uploaded
  created_at  timestamptz not null default now()
);
create index if not exists media_user_time on media (user_id, created_at desc);

-- One weekly recap per user per week. Nothing writes these yet.
create table if not exists recaps (
  id         bigint generated always as identity primary key,
  user_id    bigint not null references users(id),
  week_start date not null,
  summary    text,
  sent_at    timestamptz,                     -- null = not sent yet
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);
