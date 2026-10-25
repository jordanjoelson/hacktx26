"use server";

import { getPostcardByEditToken, markPostcardSent, updatePostcardContent } from "@/lib/db";
import { applyEdits } from "@/lib/postcard";

/** Saves the sender's edits. The edit token is the only credential: whoever has the link can edit. */
export async function savePostcard(editToken: unknown, edits: unknown): Promise<void> {
  if (typeof editToken !== "string") throw new Error("Postcard not found");
  const postcard = await getPostcardByEditToken(editToken);
  if (!postcard) throw new Error("Postcard not found");
  await updatePostcardContent(editToken, applyEdits(postcard.content, edits));
}

/** Marks the postcard sent; the agent picks it up within seconds and texts every subscriber. */
export async function sendPostcard(editToken: unknown): Promise<void> {
  if (typeof editToken !== "string") throw new Error("Postcard not found");
  await markPostcardSent(editToken);
}
