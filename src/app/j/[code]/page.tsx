import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Logo } from "@/components/logo";
import { getInviter } from "@/lib/db";
import { IntroForm } from "../../intro-form";

export const metadata: Metadata = {
  title: "Get recaps on Lately",
  robots: { index: false, follow: false },
};

// A sender's subscribe link. Visitors sign up here, text Lately once, and then get that sender's recaps.
export default function InvitePage({ params }: PageProps<"/j/[code]">) {
  return (
    <main className="flex min-h-svh items-center justify-center bg-[#efeae2] px-4 py-10">
      <Suspense fallback={null}>
        <Invite params={params} />
      </Suspense>
    </main>
  );
}

async function Invite({ params }: Pick<PageProps<"/j/[code]">, "params">) {
  const { code } = await params;
  const inviter = await getInviter(code);
  if (!inviter) notFound();
  const who = inviter.name ?? "a friend";

  return (
    <div className="w-full max-w-md">
      <section className="rounded-2xl bg-[#0047ab] p-6 text-white">
        <Logo className="h-10 w-10" />
        <h1 className="mt-6 text-4xl leading-tight font-medium tracking-[-0.03em] sm:text-5xl">
          Get {who}&apos;s week, <span className="font-serif font-normal italic">lately</span>.
        </h1>
        <p className="mt-3 text-base leading-7 text-white/85">
          Every week {who} sends a short recap: photos, notes, the good parts. Lately texts it to you on iMessage.
        </p>
      </section>
      <div className="mt-2 rounded-2xl bg-white p-6">
        <IntroForm invite={code} />
      </div>
    </div>
  );
}
