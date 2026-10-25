import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { getPostcardByEditToken } from "@/lib/db";
import { Editor } from "./editor";

export const metadata: Metadata = {
  title: "Edit your postcard",
  robots: { index: false, follow: false },
};

// The sender's link: preview the postcard, edit it, and send the view link to the recipient.
export default function EditPage({ params }: PageProps<"/edit/[token]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-[#efeae2]" />}>
      <EditLoader params={params} />
    </Suspense>
  );
}

async function EditLoader({ params }: Pick<PageProps<"/edit/[token]">, "params">) {
  const { token } = await params;
  const postcard = await getPostcardByEditToken(token);
  if (!postcard) notFound();
  return <Editor editToken={token} viewToken={postcard.viewToken} initial={postcard.content} />;
}
