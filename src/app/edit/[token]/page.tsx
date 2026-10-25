import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPostcardByEditToken, getSendInfo } from "@/lib/db";
import { Editor } from "./editor";

export const metadata: Metadata = {
  title: "Edit your postcard",
  robots: { index: false, follow: false },
};

// The sender's link: preview the postcard, edit it, and send it to their subscribers.
export default function EditPage({ params }: PageProps<"/edit/[token]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-[#efeae2]" />}>
      <EditLoader params={params} />
    </Suspense>
  );
}

async function EditLoader({ params }: Pick<PageProps<"/edit/[token]">, "params">) {
  const { token } = await params;
  const [postcard, send] = await Promise.all([getPostcardByEditToken(token), getSendInfo(token)]);
  if (!postcard || !send) notFound();
  return <Editor editToken={token} viewToken={postcard.viewToken} initial={postcard.content} send={send} />;
}
