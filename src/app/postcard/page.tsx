import type { Metadata } from "next";
import { Postcard } from "@/components/postcard/postcard";
import { samplePostcard } from "./sample";

export const metadata: Metadata = {
  title: { absolute: "Postcard · Lately" },
};

export default function PostcardPage() {
  return <Postcard card={samplePostcard} />;
}
