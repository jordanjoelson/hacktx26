"use client";

import { useState } from "react";
import styles from "@/components/postcard.module.css";
import { FormatToolbar } from "@/components/postcard-text";
import { PostcardView, StyleControl } from "@/components/postcard-view";
import { SAMPLE_POSTCARD } from "@/lib/postcard";

// Demo with sample content. Edits stay in the browser; real postcards live at /edit/<token> and /p/<token>.
export default function PostcardPage() {
  const [content, setContent] = useState(SAMPLE_POSTCARD);
  const [editing, setEditing] = useState(false);
  return (
    <>
      <PostcardView
        content={content}
        onChange={editing ? setContent : undefined}
        controls={
          <div className={styles.previewControls}>
            <StyleControl content={content} onChange={setContent} />
            <button type="button" className={`${styles.editToggle} whitespace-nowrap`} aria-pressed={editing} onClick={() => setEditing(!editing)}>
              {editing ? "Done" : "Edit"}
            </button>
          </div>
        }
      />
      {editing ? (
        <div className="fixed inset-x-0 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 flex justify-center px-2">
          <FormatToolbar />
        </div>
      ) : null}
    </>
  );
}
