import type { Metadata } from "next";
import { PostcardLayout1 } from "@/components/postcard-layout1/postcard";
import { samplePostcard } from "../sample";

export const metadata: Metadata = {
  title: { absolute: "Postcard (layout1) · Lately" },
};

/** layout1: the scrapbook version, kept for comparison. */
export default function PostcardLayout1Page() {
  return <PostcardLayout1 card={samplePostcard} />;
}
