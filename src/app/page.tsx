import { Logo } from "@/components/logo";

export default function Home() {
  return (
    <main className="relative flex min-h-svh flex-col overflow-hidden">
      <img
        src="/landscape.jpg"
        alt=""
        className="pointer-events-none absolute inset-x-0 top-[18%] h-full w-full object-cover object-bottom select-none"
        style={{
          maskImage: "linear-gradient(to bottom, transparent, #000 18%)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 18%)",
        }}
      />
      <section className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-6 py-12 sm:px-10">
        <div className="grid w-full items-start gap-12 lg:grid-cols-[minmax(0,1fr)_24rem] lg:gap-20">
          <div>
            <h1 className="font-serif text-5xl leading-[1.05] sm:text-6xl lg:text-7xl">
              Sign in to{" "}
              <span className="inline-flex items-center gap-3">
                Lately
                <Logo className="h-14 w-14 sm:h-16 sm:w-16" />
              </span>
            </h1>
            <p className="mt-5 max-w-md text-lg text-black">
              We&apos;ll send you a code to sign in.
            </p>
          </div>

          <div>
            <div className="flex h-14 items-center rounded-lg border border-neutral-200 bg-white px-4 focus-within:border-[#0047ab]">
          <span className="flex items-center gap-1.5" aria-hidden>
            <svg
              width="20"
              height="14"
              viewBox="0 0 190 100"
              className="shrink-0 rounded-[2px]"
            >
              <rect width="190" height="100" fill="#b22234" />
              <g fill="#fff">
                <rect y="7.69" width="190" height="7.69" />
                <rect y="23.08" width="190" height="7.69" />
                <rect y="38.46" width="190" height="7.69" />
                <rect y="53.85" width="190" height="7.69" />
                <rect y="69.23" width="190" height="7.69" />
                <rect y="84.62" width="190" height="7.69" />
              </g>
              <rect width="76" height="53.85" fill="#3c3b6e" />
            </svg>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className="text-neutral-500"
            >
              <path
                d="M2.5 4.5 6 8l3.5-3.5"
                stroke="currentColor"
                strokeWidth="1.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="mx-3 h-5 w-px bg-neutral-200" aria-hidden />
          <label className="sr-only" htmlFor="phone">
            Phone number
          </label>
          <input
            id="phone"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+1 (555) 000-0000"
            className="w-full bg-transparent outline-none placeholder:text-neutral-400"
          />
        </div>

        <p className="mt-8 text-base leading-7 text-neutral-800">
          By clicking the &quot;Send Code&quot; button, I agree to Lately&apos;s{" "}
          <a href="#terms" className="text-[#0047ab] underline">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#sms" className="text-[#0047ab] underline">SMS Terms</a>, and acknowledge
          the <a href="#privacy" className="text-[#0047ab] underline">Privacy Policy</a>.
        </p>

        <button
          type="button"
          className="mt-10 h-14 w-full rounded-full bg-black text-base font-semibold text-white"
        >
          Send code →
        </button>
          </div>
        </div>
      </section>
      <footer className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 py-8 text-sm text-black sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <p>Copyright © 2026 Lately</p>
        <nav className="flex flex-wrap gap-x-8 gap-y-2">
          <a href="#privacy" className="text-black underline-offset-4 hover:underline">
            Privacy policy
          </a>
          <a href="#terms" className="text-black underline-offset-4 hover:underline">
            Terms of service
          </a>
        </nav>
      </footer>
    </main>
  );
}
