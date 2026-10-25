import type { Inbound } from "./handler";

// Reply pools. `{n}` is replaced with the number of items sent.
// Add, remove, or reword lines freely; one is picked at random each time.

const PHOTO = [
  "Ooh, love this one 📸 Saved it for your week.",
  "Looks like you've been having some fun! I'll note that 📸",
  "What a moment. Tucking this away for your recap ✨",
  "Got it! This one's going in the highlights 📸",
  "Okay this is a good one. Noted 👍",
];

const PHOTOS = [
  "{n} photos?! Looks like you've been busy. Saving them all 📸",
  "Ooh, a whole photo dump. Got all {n} ✨",
  "Looks like you've been having some fun! All {n} noted 📸",
  "{n} new memories saved. Keep them coming 👍",
];

const VIDEO = [
  "Got your video 🎬 Can't wait to put this in your recap.",
  "Lights, camera, Lately 🎬 Saved it!",
  "Ooh, a video! Looks like a good time. Noted 🎬",
  "Saved this clip for your week ✨",
];

const VIDEOS = [
  "{n} videos! You've been documenting. Saved them all 🎬",
  "Got all {n} clips. This week's recap is going to be good 🎬",
  "A whole reel's worth! All {n} saved ✨",
];

const MIXED = [
  "Photos AND videos? You've been out living. Got all {n} 📸🎬",
  "Looks like you've been having some fun! Saved all {n} ✨",
  "What a haul. All {n} noted for your week 👍",
];

const FUN = [
  "Sounds like a blast! I'll remember that 🎉",
  "Love that for you. Noted ✨",
  "Looks like you've been having some fun! I'll note that 🎉",
  "Okay, this week is shaping up nicely. Saved 👍",
];

const TOUGH = [
  "That sounds like a lot. Thanks for telling me 🫂",
  "Rough one, huh? I've noted it. Hope the rest of the week is kinder 🌤️",
  "Sending you a little calm 🍵 I've got it written down.",
];

const FOOD = [
  "Okay, now I'm hungry 😋 Noted!",
  "Sounds delicious. Adding it to your week 🍽️",
  "A food moment! Saved 😋",
];

const TEXT = [
  "Got it! Adding that to your week ✍️",
  "Noted 👍 Tell me more anytime.",
  "Thanks for the update! I'll remember that.",
  "Saved ✨ Keep them coming.",
  "Love hearing about your week. Noted!",
];

const FUN_WORDS =
  /\b(fun|party|partied|concert|trip|beach|vacation|celebrat\w*|amazing|awesome|great|best|lit|danc\w*|game|festival|hang(ing)? out|friends?|lol|haha\w*)\b/i;
const TOUGH_WORDS =
  /\b(tired|exhausted|stress\w*|sad|rough|hard|awful|terrible|sick|anxious|overwhelm\w*|lonely|bad day|cried|crying|ugh)\b/i;
const FOOD_WORDS =
  /\b(food|ate|eat(ing)?|dinner|lunch|breakfast|brunch|pizza|tacos?|sushi|coffee|boba|dessert|cook(ed|ing)?|restaurant|bbq)\b/i;

// Remembers the last line used from each pool so the same reply never shows twice in a row.
const lastPick = new Map<string[], number>();

function pick(pool: string[], n = 0): string {
  let i = Math.floor(Math.random() * pool.length);
  if (pool.length > 1 && i === lastPick.get(pool)) i = (i + 1) % pool.length;
  lastPick.set(pool, i);
  return pool[i]!.replaceAll("{n}", String(n));
}

/** Chooses a reply that fits what the user sent. Media wins over text. */
export function chooseReply({ texts, media }: Inbound): string {
  const photos = media.filter((m) => m.kind === "photo").length;
  const videos = media.length - photos;

  if (photos && videos) return pick(MIXED, media.length);
  if (videos) return videos === 1 ? pick(VIDEO) : pick(VIDEOS, videos);
  if (photos) return photos === 1 ? pick(PHOTO) : pick(PHOTOS, photos);

  const text = texts.join(" ");
  if (TOUGH_WORDS.test(text)) return pick(TOUGH);
  if (FOOD_WORDS.test(text)) return pick(FOOD);
  if (FUN_WORDS.test(text)) return pick(FUN);
  return pick(TEXT);
}
