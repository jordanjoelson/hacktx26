import { Logo } from "@/components/logo";
import { ShaderBackground } from "@/components/shader-background";
import { IntroForm } from "./intro-form";

export default function Home() {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-[18%] h-full"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, #000 18%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 18%)",
        }}
      >
        <ShaderBackground className="absolute inset-0" />
      </div>
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-12 sm:px-10">
        <div className="grid w-full items-start gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-20">
          <div>
            <h1 className="font-sans text-5xl font-medium leading-[1.05] tracking-[-0.0375em] sm:text-6xl lg:text-7xl">
              Text with{" "}
              <span className="inline-flex items-baseline gap-3">
                <span className="font-serif font-normal italic tracking-[-0.03em]">
                  Lately
                </span>
                <Logo className="h-14 w-14 self-center sm:h-16 sm:w-16" />
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-black">
              Enter your number and Lately will text you on iMessage.
            </p>
          </div>

          <IntroForm />
        </div>
      </section>
      <footer className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-[#ece6e8] sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p>Copyright © 2026 Lately</p>
        <nav className="flex flex-wrap gap-x-8 gap-y-2">
          <a href="#privacy" className="text-[#ece6e8] underline-offset-4 hover:underline">
            Privacy policy
          </a>
          <a href="#terms" className="text-[#ece6e8] underline-offset-4 hover:underline">
            Terms of service
          </a>
        </nav>
      </footer>
    </main>
  );
}
