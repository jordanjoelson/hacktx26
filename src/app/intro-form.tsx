"use client";

import { useActionState, useEffect } from "react";
import { SendPlane } from "@/components/send-plane";
import { requestIntro, type IntroState } from "./actions";

const initial: IntroState = { status: "idle" };

/** iPhones, iPads (which report a Mac user agent), and Android phones. */
function isPhone(): boolean {
  const ua = navigator.userAgent;
  return /iPhone|iPad|iPod|Android/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** "+14158505302" → "(415) 850-5302" */
function formatLine(e164: string): string {
  const d = e164.replace(/^\+1/, "");
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : e164;
}

/**
 * `invite` is the sender's code on /j/<code> pages; it goes into the first text so the agent subscribes them.
 * `dark` styles it for a dark background (the homepage).
 */
export function IntroForm({ invite, dark = false }: { invite?: string; dark?: boolean }) {
  const [state, action, pending] = useActionState(requestIntro, initial);
  const c = dark
    ? {
        card: "border-white/15 bg-white/10 text-white",
        muted: "text-white/75",
        field: "border-transparent bg-white/10 text-white",
        divider: "bg-white/20",
        placeholder: "placeholder:text-white/40",
        error: "text-[#ff9b8f]",
        errorBorder: "border-[#ff9b8f]",
        link: "text-[#9cc7ff]",
        button: "bg-white text-black",
      }
    : {
        card: "border-neutral-200 bg-white",
        muted: "text-neutral-800",
        field: "border-neutral-200 bg-white focus-within:border-[#0047ab]",
        divider: "bg-neutral-200",
        placeholder: "placeholder:text-neutral-400",
        error: "text-[#b42318]",
        errorBorder: "border-[#b42318]",
        link: "text-[#0047ab]",
        button: "bg-black text-white",
      };
  const link = state.status === "ready" ? state.link : undefined;

  // On a phone, jump straight into Messages with the hello typed out. The button below is the fallback.
  useEffect(() => {
    if (link && isPhone()) window.location.href = link;
  }, [link]);

  if (state.status === "ready") {
    return (
      <div role="status" className={`rounded-lg border p-6 ${c.card}`}>
        <p className="text-2xl font-medium">Say hi to Lately.</p>
        <p className={`mt-2 text-base leading-7 ${c.muted}`}>
          Text <span className="font-semibold">&ldquo;{state.hello}&rdquo;</span> to{" "}
          <span className="font-semibold whitespace-nowrap">{formatLine(state.line)}</span> from your iPhone, and{" "}
          {invite ? "you'll get their recaps from Lately." : "Lately will text back."}
        </p>
        <a
          href={state.link}
          className={`mt-6 flex h-14 w-full items-center justify-center rounded-full text-base font-semibold ${c.button}`}
        >
          Open Messages →
        </a>
      </div>
    );
  }

  const error = state.status === "error" ? state : undefined;

  return (
    <form action={action}>
      {invite ? <input type="hidden" name="invite" value={invite} /> : null}
      <div
        className={`flex h-14 items-center rounded-lg border px-4 ${c.field} ${error ? c.errorBorder : ""}`}
      >
        <span className="flex items-center gap-1.5" aria-hidden>
          <svg width="20" height="14" viewBox="0 0 190 100" className="shrink-0 rounded-[2px]">
            <rect width="190" height="100" fill="#b22234" />
            <g fill="#fff">
              <rect y="7.69" width="190" height="7.69" />
              <rect y="23.08" width="190" height="7.69" />
              <rect y="38.46" width="190" height="7.69" />
              <rect y="53.85" width="190" height="7.69" />
              <rect y="69.23" width="190" height="7.69" />
              <rect y="84.62" width="190" height="7.69" />
            </g>
            <rect width="76" height="53.85" fill="#3c3b6e" />
          </svg>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="text-neutral-500">
            <path
              d="M2.5 4.5 6 8l3.5-3.5"
              stroke="currentColor"
              strokeWidth="1.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <span className={`mx-3 h-5 w-px ${c.divider}`} aria-hidden />
        <label className="sr-only" htmlFor="phone">
          Phone number
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="+1 (555) 000-0000"
          defaultValue={error?.phone}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "phone-error" : undefined}
          className={`w-full bg-transparent outline-none ${c.placeholder}`}
        />
      </div>
      {error ? (
        <p id="phone-error" role="alert" className={`mt-2 text-sm ${c.error}`}>
          {error.message}
        </p>
      ) : null}

      <p className={`mt-8 text-base leading-7 ${c.muted}`}>
        By clicking the &quot;Text Lately&quot; button, I agree to Lately&apos;s{" "}
        <a href="#terms" className={`underline ${c.link}`}>
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#sms" className={`underline ${c.link}`}>
          SMS Terms
        </a>
        , and acknowledge the{" "}
        <a href="#privacy" className={`underline ${c.link}`}>
          Privacy Policy
        </a>
        .
      </p>

      <button
        type="submit"
        disabled={pending}
        // No dimming while pending: the plane flying off is the feedback.
        className={`mt-10 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full text-base font-semibold ${c.button}`}
      >
        Text Lately
        <SendPlane flying={pending} />
      </button>
    </form>
  );
}
