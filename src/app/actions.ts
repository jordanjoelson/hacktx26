"use server";

import { createIntro } from "@/lib/db";
import { toE164 } from "@/lib/phone";

export type IntroState =
  | { status: "idle" }
  | { status: "sent" }
  | { status: "error"; message: string; phone: string };

/** Homepage form: queues a hello text. The agent picks it up from the `intros` table and sends it. */
export async function requestIntro(_previous: IntroState, form: FormData): Promise<IntroState> {
  const raw = String(form.get("phone") ?? "");
  const phone = toE164(raw);
  if (!phone) return { status: "error", message: "Enter a US phone number, like (512) 555-0123.", phone: raw };

  try {
    await createIntro(phone);
  } catch (err) {
    console.error("failed to queue intro:", err);
    return { status: "error", message: "Something went wrong. Try again in a moment.", phone: raw };
  }
  return { status: "sent" };
}
