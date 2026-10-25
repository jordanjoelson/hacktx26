"use client";

import { useState } from "react";
import { Postcard } from "@/components/postcard";
import { SAMPLE_POSTCARD } from "@/lib/postcard";

// Demo with sample content. Edits stay in the browser; real postcards live at /edit/<token> and /p/<token>.
export default function PostcardPage() {
  const [content, setContent] = useState(SAMPLE_POSTCARD);
  return <Postcard content={content} onChange={setContent} />;
}
