"use client";

import { useActionState } from "react";
import { requestIntro, type IntroState } from "./actions";

const initial: IntroState = { status: "idle" };

export function IntroForm() {
  const [state, action, pending] = useActionState(requestIntro, initial);

  if (state.status === "sent") {
    return (
      <div role="status" className="rounded-lg border border-neutral-200 bg-white p-6">
        <p className="text-2xl font-medium">Check your messages.</p>
        <p className="mt-2 text-base leading-7 text-neutral-800">
          Lately will text you in a few seconds. Reply with anything to get started.
        </p>
      </div>
    );
  }

  const error = state.status === "error" ? state : undefined;

  return (
    <form action={action}>
      <div
        className={`flex h-14 items-center rounded-lg border bg-white px-4 focus-within:border-[#0047ab] ${error ? "border-[#b42318]" : "border-neutral-200"}`}
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
        <span className="mx-3 h-5 w-px bg-neutral-200" aria-hidden />
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
          className="w-full bg-transparent outline-none placeholder:text-neutral-400"
        />
      </div>
      {error ? (
        <p id="phone-error" role="alert" className="mt-2 text-sm text-[#b42318]">
          {error.message}
        </p>
      ) : null}

      <p className="mt-8 text-base leading-7 text-neutral-800">
        By clicking the &quot;Text me&quot; button, I agree to Lately&apos;s{" "}
        <a href="#terms" className="text-[#0047ab] underline">
          Terms of Service
        </a>{" "}
        and{" "}
        <a href="#sms" className="text-[#0047ab] underline">
          SMS Terms
        </a>
        , and acknowledge the{" "}
        <a href="#privacy" className="text-[#0047ab] underline">
          Privacy Policy
        </a>
        .
      </p>

      <button
        type="submit"
        disabled={pending}
        className="mt-10 h-14 w-full rounded-full bg-black text-base font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Sending…" : "Text me →"}
      </button>
    </form>
  );
}
