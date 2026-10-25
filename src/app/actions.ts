"use server";

import { toE164 } from "@/lib/phone";
import { registerUser } from "@/lib/photon";

const HELLO = "Hey Lately!";

export type IntroState =
  | { status: "idle" }
  | { status: "ready"; line: string; hello: string; link: string }
  | { status: "error"; message: string; phone: string };

/**
 * Homepage form: registers the number with Photon and returns their Lately line.
 * The person sends the first text (Photon's shared lines require it); the agent replies from there.
 */
export async function requestIntro(_previous: IntroState, form: FormData): Promise<IntroState> {
  const raw = String(form.get("phone") ?? "");
  const phone = toE164(raw);
  if (!phone) return { status: "error", message: "Enter a US phone number, like (512) 555-0123.", phone: raw };

  try {
    const { assignedPhoneNumber: line } = await registerUser(phone);
    // "?&body=" is the form both iOS and Android Messages accept.
    return { status: "ready", line, hello: HELLO, link: `sms:${line}?&body=${encodeURIComponent(HELLO)}` };
  } catch (err) {
    console.error("failed to register with Photon:", err);
    return { status: "error", message: "Something went wrong. Try again in a moment.", phone: raw };
  }
}
