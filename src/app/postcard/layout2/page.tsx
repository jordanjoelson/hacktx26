import type { Metadata } from "next";
import { PostcardLayout2 } from "@/components/postcard-layout2/postcard";
import { samplePostcard } from "../sample";

export const metadata: Metadata = {
  title: { absolute: "Postcard (layout2) · Lately" },
};

/** layout2: the card-grid version, kept for comparison. */
export default function PostcardLayout2Page() {
  return <PostcardLayout2 card={samplePostcard} />;
}
