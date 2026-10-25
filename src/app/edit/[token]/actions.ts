"use server";

import { getPostcardByEditToken, markPostcardSent, updatePostcardContent } from "@/lib/db";
import { applyEdits, sanitizeStyle } from "@/lib/postcard";

/** Saves the sender's edits. The edit token is the only credential: whoever has the link can edit. */
export async function savePostcard(editToken: unknown, edits: unknown): Promise<void> {
  if (typeof editToken !== "string") throw new Error("Postcard not found");
  const postcard = await getPostcardByEditToken(editToken);
  if (!postcard) throw new Error("Postcard not found");
  const next = applyEdits(postcard.content, edits);
  // applyEdits only updates fields the stored postcard already has, and most postcards start without
  // a style, so the style is validated and copied over on its own (invalid settings are dropped).
  if (edits && typeof edits === "object" && "style" in edits) {
    const style = sanitizeStyle((edits as { style?: unknown }).style);
    if (style) next.style = style;
    else delete next.style;
  }
  await updatePostcardContent(editToken, next);
}

/** Marks the postcard sent; the agent picks it up within seconds and texts every subscriber. */
export async function sendPostcard(editToken: unknown): Promise<void> {
  if (typeof editToken !== "string") throw new Error("Postcard not found");
  await markPostcardSent(editToken);
}
