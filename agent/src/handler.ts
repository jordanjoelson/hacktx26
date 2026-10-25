import { contact, type Content, type Message, type Space, type SpectrumInstance } from "spectrum-ts";
import { imessage } from "spectrum-ts/providers/imessage";
import { museReply } from "./muse";
import { createRecap, RECAP_COMMAND } from "./recap";
import { chooseReply } from "./responses";
import { getUser, markIntroduced, remember, saveMedia, saveName, setPendingRecap, type UserState } from "./users";

export type App = SpectrumInstance;

type Attachment = Extract<Content, { type: "attachment" }>;

export type MediaKind = "photo" | "video";

export interface MediaItem {
  kind: MediaKind;
  name: string;
  mimeType: string;
  attachment: Attachment;
}

/** Everything useful in one inbound message, with groups flattened. */
export interface Inbound {
  texts: string[];
  media: MediaItem[];
}

const PHOTO_EXT = /\.(jpe?g|png|gif|webp|heic|heif)$/i;
const VIDEO_EXT = /\.(mov|mp4|m4v)$/i;

export function classifyAttachment(name: string, mimeType: string): MediaKind | undefined {
  const mime = mimeType.toLowerCase();
  if (mime.startsWith("image/") || PHOTO_EXT.test(name)) return "photo";
  if (mime.startsWith("video/") || mime === "application/quicktime" || VIDEO_EXT.test(name)) {
    return "video";
  }
  return undefined;
}

/** Recursively flattens a message's content into texts and media. */
export function flatten(content: Content, into: Inbound = { texts: [], media: [] }): Inbound {
  switch (content.type) {
    case "text":
      if (content.text.trim()) into.texts.push(content.text);
      break;
    case "attachment": {
      const kind = classifyAttachment(content.name, content.mimeType);
      if (kind) {
        into.media.push({ kind, name: content.name, mimeType: content.mimeType, attachment: content });
      } else {
        console.log(`  skipping unsupported attachment ${content.name} (${content.mimeType})`);
      }
      break;
    }
    case "group":
      for (const item of content.items) flatten(item.content, into);
      break;
    default:
      // Reactions, read receipts, typing, etc.
      break;
  }
  return into;
}

/** Short label for the per-message log line. */
export function describeContent(content: Content): string {
  return content.type === "group" ? `group(${content.items.length})` : content.type;
}

async function saveMediaItem(user: UserState, spectrumId: string, item: MediaItem): Promise<void> {
  // TODO(next milestone): `await item.attachment.read()`, upload the bytes to object storage, and set storage_url.
  // Not downloading here keeps replies fast; a 30 MB video used to delay the reply until it finished.
  const size = item.attachment.size === undefined ? "size unknown" : `${item.attachment.size} bytes`;
  console.log(`  ${item.kind}: ${item.name} (${item.mimeType}, ${size})`);
  await saveMedia(user, spectrumId, item);
}

/** e.g. "[sent 2 photos and 1 video]", so Muse knows media came along with the text. */
function mediaNote(media: MediaItem[]): string {
  if (media.length === 0) return "";
  const photos = media.filter((m) => m.kind === "photo").length;
  const videos = media.length - photos;
  const parts: string[] = [];
  if (photos) parts.push(`${photos} photo${photos === 1 ? "" : "s"}`);
  if (videos) parts.push(`${videos} video${videos === 1 ? "" : "s"}`);
  return `[sent ${parts.join(" and ")}]`;
}

/**
 * Muse writes the reply when the message has text; media-only messages get a canned reply.
 * Canned replies are also the fallback if Muse fails or times out.
 */
async function composeReply(user: UserState, inbound: Inbound, spectrumId: string): Promise<string> {
  const turn = [inbound.texts.join("\n"), mediaNote(inbound.media)].filter(Boolean).join("\n");

  let reply: string | undefined;
  const recap = inbound.media.length === 0 ? RECAP_COMMAND.exec(turn) : null;
  if (recap) {
    reply = await requestRecap(user, recap[1]);
  } else if (inbound.texts.length > 0) {
    const result = await museReply(user, turn);
    if (result?.recap) return finish(user, turn, spectrumId, await requestRecap(user, result.recap.for));
    if (result?.name) {
      await saveName(user, result.name);
      console.log(`  learned name: ${result.name}`);
      if (user.pendingRecapFor !== undefined) {
        const forWhom = user.pendingRecapFor || undefined;
        await setPendingRecap(user, undefined);
        return finish(user, turn, spectrumId, `Thanks, ${result.name}! ${await createRecap(user, forWhom)}`);
      }
    }
    reply = result?.reply;
  }
  reply ??= chooseReply(inbound);
  return finish(user, turn, spectrumId, reply);
}

/** Makes the recap now, or first asks their name so the postcard isn't signed "From me". */
async function requestRecap(user: UserState, forWhom: string | undefined): Promise<string> {
  if (user.name) return createRecap(user, forWhom);
  await setPendingRecap(user, forWhom ?? "");
  return "On it! What should I sign it as? Just your first name.";
}

/** Saves both sides of the exchange and returns the reply to send. */
async function finish(user: UserState, turn: string, spectrumId: string, reply: string): Promise<string> {
  await remember(user, "user", turn, spectrumId);
  await remember(user, "assistant", reply);
  return reply;
}

/**
 * Sends a vCard named "Lately" with the line's own number, once per sender, in DMs only.
 * Tapping it in iMessage offers "Create New Contact" with the name already filled in.
 */
async function shareContactOnce(space: Space, user: UserState): Promise<void> {
  if (user.introduced || !imessage.is(space) || space.type !== "dm") return;
  await markIntroduced(user);

  await space.send("P.S. Tap the card below and hit “Create New Contact” to save me as Lately 👍");
  await space.send(
    contact({
      name: { formatted: "Lately", first: "Lately" },
      phones: [{ value: space.phone, type: "mobile" }],
      note: "Your weekly recap buddy. Text me photos, videos, and notes about your week.",
    }),
  );
}

/**
 * Handles one inbound message from one sender. Called serially per sender.
 * Onboarding and Muse Spark calls plug in here.
 */
export async function handleInbound(app: App, space: Space, message: Message): Promise<void> {
  const inbound = flatten(message.content);
  if (inbound.texts.length === 0 && inbound.media.length === 0) return;

  const started = Date.now();
  const user = await getUser(message.sender?.id ?? "unknown");

  // Flips the sender's "Delivered" to "Read <time>". Not awaited, so it never delays the reply.
  message.read().catch((err) => console.error(`  failed to send read receipt:`, err));

  await app.responding(space, async () => space.send(await composeReply(user, inbound, message.id)));
  console.log(`  replied in ${Date.now() - started} ms`);

  for (const item of inbound.media) await saveMediaItem(user, message.id, item);

  try {
    await shareContactOnce(space, user);
  } catch (err) {
    console.error(`  failed to share contact card:`, err);
  }
}
