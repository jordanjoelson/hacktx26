"use server";

import { getInviter } from "@/lib/db";
import { toE164 } from "@/lib/phone";
import { registerUser } from "@/lib/photon";

export type IntroState =
  | { status: "idle" }
  | { status: "ready"; line: string; hello: string; link: string }
  | { status: "error"; message: string; phone: string };

/**
 * Sign-up form on the homepage and on invite pages (/j/<code>): registers the number with Photon and returns
 * their Lately line plus the first text to send. They send it themselves (Photon's shared lines require it);
 * on an invite page that text carries the code, so the agent subscribes them to that sender.
 */
export async function requestIntro(_previous: IntroState, form: FormData): Promise<IntroState> {
  const raw = String(form.get("phone") ?? "");
  const phone = toE164(raw);
  if (!phone) return { status: "error", message: "Enter a US phone number, like (512) 555-0123.", phone: raw };

  try {
    let hello = "Hey Lately!";
    const code = form.get("invite");
    if (typeof code === "string" && code) {
      const inviter = await getInviter(code);
      if (!inviter) return { status: "error", message: "This invite link doesn't work anymore.", phone: raw };
      hello = `Hi Lately! Sign me up for ${inviter.name ?? "their"}${inviter.name ? "'s" : ""} recaps (code: ${code})`;
    }

    const { assignedPhoneNumber: line } = await registerUser(phone);
    // "?&body=" is the form both iOS and Android Messages accept.
    return { status: "ready", line, hello, link: `sms:${line}?&body=${encodeURIComponent(hello)}` };
  } catch (err) {
    console.error("failed to register with Photon:", err);
    return { status: "error", message: "Something went wrong. Try again in a moment.", phone: raw };
  }
}
