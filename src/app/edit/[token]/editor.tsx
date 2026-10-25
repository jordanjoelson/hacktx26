"use client";

import { useEffect, useState, useTransition } from "react";
import { Postcard } from "@/components/postcard";
import type { PostcardContent } from "@/lib/postcard";
import { savePostcard } from "./actions";

export function Editor({
  editToken,
  viewToken,
  initial,
}: {
  editToken: string;
  viewToken: string;
  initial: PostcardContent;
}) {
  const [content, setContent] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [error, setError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saving, startSaving] = useTransition();
  const dirty = content !== saved;

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function save() {
    const snapshot = content;
    startSaving(async () => {
      try {
        await savePostcard(editToken, snapshot);
        setSaved(snapshot);
        setError(false);
      } catch {
        setError(true);
      }
    });
  }

  async function send() {
    const url = `${window.location.origin}/p/${viewToken}`;
    if (navigator.share) {
      // On phones this opens the share sheet (Messages, etc.). Cancelling throws; nothing to do.
      await navigator.share({ title: `A postcard for ${content.to}`, url }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const status = saving ? "Saving…" : error ? "Couldn't save. Try again." : dirty ? "Unsaved changes" : "Saved";

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
            disabled={!dirty || saving}
            className="rounded-xl bg-white/15 px-4 py-2.5 text-sm disabled:opacity-40"
          >
            Save
          </button>
          <button
            type="button"
            onClick={send}
            disabled={dirty || saving}
            title={dirty ? "Save first" : undefined}
            className="rounded-xl bg-[#fff04a] px-4 py-2.5 text-sm text-black disabled:opacity-40"
          >
            {copied ? "Link copied" : "Send"}
          </button>
        </div>
      </div>
    </>
  );
}
