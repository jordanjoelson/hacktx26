"use client";

import { useEffect, useState, useTransition } from "react";
import { Postcard } from "@/components/postcard";
import type { SendInfo } from "@/lib/db";
import type { PostcardContent } from "@/lib/postcard";
import { savePostcard, sendPostcard } from "./actions";

export function Editor({
  editToken,
  viewToken,
  initial,
  send: sendInfo,
}: {
  editToken: string;
  viewToken: string;
  initial: PostcardContent;
  send: SendInfo;
}) {
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [sent, setSent] = useState(sendInfo.sent);
  const [error, setError] = useState<string | null>(null);
  const [panel, setPanel] = useState(false);
  const [working, startWork] = useTransition();
  const dirty = content !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function save() {
    const snapshot = content;
    startWork(async () => {
      try {
        await savePostcard(editToken, snapshot);
        setSaved(snapshot);
        setError(null);
      } catch {
        setError("Couldn't save. Try again.");
      }
    });
  }

  /** Saves any edits first, so subscribers get what's on screen. */
  function send() {
    const snapshot = content;
    startWork(async () => {
      try {
        if (snapshot !== saved) {
          await savePostcard(editToken, snapshot);
          setSaved(snapshot);
        }
        await sendPostcard(editToken);
        setSent(true);
        setError(null);
      } catch {
        setError("Couldn't send. Try again.");
      }
    });
  }

  const status = working ? "Working…" : error ? error : dirty ? "Unsaved changes" : sent ? "Sent ✓" : "Saved";

  return (
    <>
      <Postcard content={content} onChange={setContent} className="pb-32" />
      <div className="fixed inset-x-0 bottom-0 z-40 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-4">
        <div className="mx-auto flex max-w-3xl items-center gap-2 rounded-2xl bg-black p-2 pl-4 text-white shadow-lg">
          <div className="min-w-0 flex-1">
            <p role="status" className={`text-sm ${error ? "text-[#ffb7d5]" : ""}`}>
              {status}
            </p>
            <p className="hidden truncate text-xs text-white/60 sm:block">
              Tap text to edit · ==highlight== · ++pink++ · ~~cross out~~ · {"{name}"}
            </p>
          </div>
          <a
            href={`/p/${viewToken}`}
            target="_blank"
            rel="noreferrer"
            className="rounded-xl px-3 py-2.5 text-sm text-white/80 hover:text-white"
          >
            Preview
          </a>
          <button
            type="button"
            onClick={save}
            disabled={!dirty || working}
            className="rounded-xl bg-white/15 px-4 py-2.5 text-sm disabled:opacity-40"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setPanel(true)}
            className="rounded-xl bg-[#fff04a] px-4 py-2.5 text-sm text-black"
          >
            Send
          </button>
        </div>
      </div>
      {panel ? (
        <SendPanel
          info={sendInfo}
          sent={sent}
          working={working}
          onSend={send}
          onClose={() => setPanel(false)}
        />
      ) : null}
    </>
  );
}

function SendPanel({
  info,
  sent,
  working,
  onSend,
  onClose,
}: {
  info: SendInfo;
  sent: boolean;
  working: boolean;
  onSend: () => void;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const count = info.subscribers;
  const people = `${count} ${count === 1 ? "person" : "people"}`;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function shareInvite() {
    const url = `${window.location.origin}/j/${info.inviteCode}`;
    if (navigator.share) {
      // Cancelling the share sheet throws; nothing to do.
      await navigator.share({ title: "Get my recaps on Lately", url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-2 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-title"
        className="w-full max-w-md rounded-2xl bg-white p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id="send-title" className="text-2xl font-medium">
            {sent ? "Sent ✓" : "Send your recap"}
          </h2>
          <button type="button" aria-label="Close" onClick={onClose} className="-m-2 p-2 text-2xl leading-none">
            ×
          </button>
        </div>

        <p className="mt-2 text-base leading-7 text-neutral-800">
          {sent
            ? count > 0
              ? `Lately is texting it to your ${people}. Anyone who subscribes later gets it too.`
              : "Anyone who subscribes with your link will get it from Lately."
            : count > 0
              ? `Lately will text it to the ${people} subscribed to your recaps.`
              : "No one's subscribed yet. Send it anyway, and everyone who joins with your link gets it from Lately."}
        </p>

        {sent ? null : (
          <button
            type="button"
            onClick={onSend}
            disabled={working}
            className="mt-6 h-14 w-full rounded-full bg-black text-base font-semibold text-white disabled:opacity-60"
          >
            {working ? "Sending…" : count > 0 ? `Send to ${people}` : "Send"}
          </button>
        )}

        <div className="mt-6 border-t border-neutral-200 pt-5">
          <p className="text-sm font-medium">Invite your people</p>
          <p className="mt-1 text-sm leading-6 text-neutral-600">
            They tap your link, text Lately once, and get your recaps every week.
          </p>
          <button
            type="button"
            onClick={shareInvite}
            className="mt-3 h-12 w-full rounded-full border border-neutral-300 text-sm font-semibold"
          >
            {copied ? "Link copied" : "Share your link"}
          </button>
        </div>
      </div>
    </div>
  );
}
