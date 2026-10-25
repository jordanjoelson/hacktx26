import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { PostcardView } from "@/components/postcard-view";
import { getPostcardByViewToken } from "@/lib/db";

export const metadata: Metadata = {
  title: "A postcard for you",
  robots: { index: false, follow: false },
};

// The recipient's link: read-only.
export default function ViewPage({ params }: PageProps<"/p/[token]">) {
  return (
    <Suspense fallback={<main className="min-h-svh bg-[#efeae2]" />}>
      <ViewLoader params={params} />
    </Suspense>
  );
}

async function ViewLoader({ params }: Pick<PageProps<"/p/[token]">, "params">) {
  const { token } = await params;
  const content = await getPostcardByViewToken(token);
  if (!content) notFound();
  return <PostcardView content={content} />;
}
