"use client";

import { useState } from "react";
import { Postcard } from "@/components/postcard";
import { SAMPLE_POSTCARD } from "@/lib/postcard";
import styles from "@/components/postcard.module.css";

// Demo with sample content. Edits stay in the browser; real postcards live at /edit/<token> and /p/<token>.
export default function PostcardPage() {
  const [content, setContent] = useState(SAMPLE_POSTCARD);
  const [editing, setEditing] = useState(false);
  return <Postcard content={content} onChange={editing ? setContent : undefined} controls={
    <div className={styles.previewControls}>
      <span className={styles.demoBadge}>Sample postcard</span>
      <button type="button" className={styles.editToggle} aria-pressed={editing} onClick={() => setEditing(!editing)}>
        {editing ? "Done editing" : "Edit sample"}
      </button>
    </div>
  } />;
}
