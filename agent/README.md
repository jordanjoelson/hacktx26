# Lately agent

The iMessage side of **Lately**. Users text the Lately number photos, short videos, and notes about their week. This worker receives those messages through [Photon Spectrum](https://photon.codes/spectrum) (`spectrum-ts`, cloud iMessage provider) and replies.

**Milestone 1 (current):** a reply loop that proves the pipeline works end to end.

Messages with text get a reply written by **Muse Spark** (`src/muse.ts`, `muse-spark-1.3`, minimal reasoning). Muse sees the sender's last 12 messages and Lately's persona. It asks for the sender's name once and then uses it now and then. Photos and videos aren't sent to Muse; a text sent with them is passed along as e.g. `[sent 2 photos]`.

Media-only messages, and any message where Muse fails or takes longer than 8 s, get a canned reply picked at random from a pool in `src/responses.ts` that fits what was sent:

| Inbound | Pool |
| --- | --- |
| One photo / several photos | `PHOTO` / `PHOTOS`, e.g. `Looks like you've been having some fun! I'll note that 📸` |
| One video / several videos | `VIDEO` / `VIDEOS` |
| Photos and videos together | `MIXED` |
| Text mentioning something hard (tired, stressed, rough…) | `TOUGH` |
| Text mentioning food | `FOOD` |
| Text mentioning something fun (party, trip, friends…) | `FUN` |
| Any other text | `TEXT` |
| Reactions, read receipts, typing, etc. | Ignored |

- The sender's message flips to "Read" as soon as it arrives.
- A typing indicator shows while the agent works on a reply.
- After a sender's first reply, the agent sends a contact card named "Lately" with the line's number so they can save it.
- Names, every message both ways, and "already sent the card" are saved in Tiger Cloud (`src/users.ts`), so they survive restarts. See [Database](#database).
- Each sender's messages are handled in order through a per-sender queue, so one sender's slow work never blocks anyone else.
- Each inbound message is logged as one line (timestamp, sender, content type). Each attachment's name, mimeType, and size are logged and saved to the `media` table. The files themselves aren't stored yet.
- An error in one message is logged and never crashes the loop.

Coming next: onboarding, uploading media files (storage not chosen yet), Muse Spark postcard generation, and weekly cron sends. Most of that goes in `src/handler.ts`.

## Layout

```
agent/
  src/
    config.ts   # loads .env, validates required env vars
    db.ts       # Postgres pool for Tiger Cloud
    index.ts    # starts Spectrum, message loop, per-sender queue, shutdown
    handler.ts  # handleInbound(): flattens content, read receipt, reply, contact card
    muse.ts      # museReply(): asks Muse Spark for a reply, parses a learned name
    users.ts     # per-sender memory in the DB: name, history, contact card sent, media
    responses.ts # canned reply pools and chooseReply() (fallback)
  db/
    schema.sql   # tables: users, messages, media, recaps
    tiger-ca.pem # Timescale's CA cert, so Node can verify the TLS connection
  .env.example
  package.json
  tsconfig.json
```

The folder is self-contained, with its own dependencies and config, and nothing outside `agent/` is imported.

## Run locally

Requires Node 20+.

```bash
cd agent
npm install
cp .env.example .env      # then fill in PHOTON_PROJECT_ID, PHOTON_PROJECT_SECRET, MUSE_API_KEY, and DATABASE_URL
npm run dev               # tsx watch: restarts on file changes
```

You should see `Lately is listening…`. Text your Photon iMessage number from your phone and you'll get a reply.

If a variable is missing, startup fails with a message like `Missing env var PHOTON_PROJECT_ID`.

Other scripts:

- `npm start`: run once without watching (this is what Railway runs)
- `npm run typecheck`: `tsc --noEmit`

## Database

The agent's database is a **Tiger Cloud** service (managed Postgres 18 with TimescaleDB), on the free plan.

- Connection string goes in `.env` as `DATABASE_URL` (`postgres://tsdbadmin:<password>@<host>:<port>/tsdb?sslmode=require`). Get it from a teammate or the [Tiger Cloud console](https://console.cloud.tigerdata.com). Never commit it.
- Quick check: `psql "$DATABASE_URL" -c "\dx timescaledb"`
- Create or update the tables: `psql "$DATABASE_URL" -f db/schema.sql` (safe to re-run).
- Tables: `users` (one per sender), `messages` (every turn; Muse sees each user's last 12), `media` (photo/video metadata), `recaps` (one per user per week; not written yet).
- Tiger Cloud's certificate is signed by Timescale's own CA, so `src/db.ts` verifies it against `db/tiger-ca.pem`. That CA expires Oct 2027; to refresh it, grab the second cert from `openssl s_client -starttls postgres -connect <host>:<port> -showcerts`.

## Deploy to Railway

This is a **background worker**. It has no HTTP server, no port, and no health check. It holds a streaming connection to Spectrum.

1. Create a new service from the GitHub repo.
2. **Settings → Root Directory:** `agent/`
3. **Start command:** `npm start`
4. **Variables:** add `PHOTON_PROJECT_ID`, `PHOTON_PROJECT_SECRET`, `MUSE_API_KEY`, and `DATABASE_URL`.
5. **Restart policy:** "On Failure"
6. Don't generate a public domain. Nothing needs one.

If the Spectrum message stream ever ends (for example, a dropped connection), the process logs it and exits with code 1, and Railway restarts it. On SIGTERM (a redeploy), it calls `app.stop()` and exits 0.

`tsx` is a regular dependency (not a devDependency), so it's still installed if Railway prunes dev dependencies.

## Merging into the Next.js repo

1. Copy this whole `agent/` folder into the repo root. Leave out `node_modules` and `.env`; both are gitignored.
2. If the Next.js app is also at the repo root, keep Next's build from typechecking or linting the agent:
   - Root `tsconfig.json`: add `"agent"` to `exclude`:
     ```json
     "exclude": ["node_modules", "agent"]
     ```
   - ESLint: add `agent/**` to the ignore list. Flat config (`eslint.config.mjs`):
     ```js
     { ignores: ["agent/**"] }
     ```
     Legacy `.eslintrc`: add `agent` to `.eslintignore`.
3. Keep installing and running the agent from inside `agent/` (`cd agent && npm install`). Don't add it to npm workspaces.
4. In Railway, the agent is its own service with root directory `agent/`. The web app is a separate service.
