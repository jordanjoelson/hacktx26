"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ProfileCard, type Profile } from "@/components/profile-card";

const samples = ["Maya", "Jordan"];

const birthdays = [
  {
    id: "theirs",
    label: (name: string) => `${name}'s birthday`,
    when: "Jun 14",
    note: (name: string) => `Saved. You usually send ${name} something small.`,
  },
  {
    id: "sam",
    label: () => "Sam",
    when: "Mar 3",
    note: (name: string) => `You flagged this for ${name} too.`,
  },
  {
    id: "alex",
    label: () => "Alex",
    when: "Nov 19",
    note: (name: string) => `${name} was there last year.`,
  },
];

const tile = "relative min-w-0 rounded-2xl";
const LOAD_TIME = 1200;

function profileFor(name: string): Profile {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials =
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "•";
  const person = name.trim() || "them";
  return {
    initials,
    name: person,
    handle: "From you",
    bio: `The short version of the week, for ${person}. Walking, one dinner, and the part you would have asked about.`,
    stat: "4",
    statLabel: "Notes this week",
    week: [0.35, 0.5, 0.3, 0.65, 0.55, 0.8, 1],
  };
}

export default function PostcardPage() {
  const [draft, setDraft] = useState("Maya");
  const name = draft.trim() || "them";
  const [photo, setPhoto] = useState<string | null>(null);
  const [openBirthday, setOpenBirthday] = useState(birthdays[0].id);
  const [view, setView] = useState<{ src: string; caption: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const birthday = birthdays.find((item) => item.id === openBirthday) ?? birthdays[0];

  useEffect(() => {
    timer.current = setTimeout(() => setLoading(false), LOAD_TIME);
    return () => clearTimeout(timer.current);
  }, []);

  function showPerson(sample: string) {
    setDraft(sample);
    setLoading(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setLoading(false), LOAD_TIME);
  }

  function usePhoto(file: File | undefined) {
    if (!file) return;
    setPhoto((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
  }

  return (
    <main className="min-h-svh bg-[#efeae2] px-2 py-3 sm:px-4 sm:py-6">
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-6">
        <section className="col-span-2 flex min-h-48 flex-col justify-between rounded-2xl bg-[#0047ab] p-5 text-white sm:col-span-6 sm:min-h-56">
          <div className="flex items-start justify-between text-sm">
            <span>From you</span>
            <span className="flex gap-3">
              {samples.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => showPerson(sample)}
                  className={sample === draft ? "text-white" : "text-white/60"}
                >
                  {sample}
                </button>
              ))}
            </span>
          </div>
          <div>
            <label htmlFor="person" className="text-sm text-white/80">
              To
            </label>
            <input
              id="person"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              className="w-full bg-transparent text-5xl text-white outline-none sm:text-6xl"
            />
          </div>
        </section>

        <ProfileCard
          profile={profileFor(name)}
          loading={loading}
          className="col-span-2 sm:col-span-6"
        />

        <section className={`${tile} col-span-2 bg-white p-4 text-base leading-7 sm:col-span-4 sm:p-5 sm:text-lg sm:leading-8`}>
          {name}, the week was mostly <Mark>walking</Mark> and one long dinner.
          I almost <Cut>left it out</Cut>, then <Mark tone="pink">kept it</Mark>{" "}
          because you would have asked. This is the short version, the one you
          can read on a train. The part I still have is the walk after, when it
          got quiet. You stopped at every window. I kept the pace, which is the
          opposite of how this usually goes.
        </section>
        <Photo
          caption="Thursday"
          src="/postcard/thursday.jpg"
          imgClassName="object-left"
          onOpen={setView}
          className="col-span-2 aspect-[4/3] sm:col-span-2 sm:col-start-5 sm:aspect-[3/4]"
        />

        <Photo
          caption="The dinner"
          src="/postcard/dinner.jpg"
          imgClassName="object-center"
          onOpen={setView}
          className="col-span-2 h-52 sm:col-span-6 sm:h-64"
        />

        <section className={`${tile} col-span-2 bg-white p-4 sm:col-span-4 sm:p-5`}>
          <p className="text-xs">Rec</p>
          <h2 className="mt-2 text-3xl sm:text-4xl">Bookstore</h2>
          <p className="mt-3 text-base leading-7 sm:text-lg sm:leading-8">
            You&apos;d like the corner bookstore. You both stopped, and you
            stayed longer than you meant to. Go back on a <Mark>weekday</Mark>,
            before the tables fill. There&apos;s a chair by the window you would
            take without asking.
          </p>
        </section>
        <div
          className={`${tile} col-span-2 flex min-h-44 flex-col items-center justify-center overflow-hidden border-2 border-dashed border-black/25 bg-[#f6f1e7] text-center sm:col-span-2`}
        >
          {photo ? (
            <button
              type="button"
              aria-label={`Expand You and ${name}`}
              onClick={() => setView({ src: photo, caption: `You and ${name}` })}
              className="absolute inset-0"
            >
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </button>
          ) : (
            <span className="px-4 text-4xl leading-none">Together</span>
          )}
          <label
            className={`z-10 cursor-pointer px-4 text-xs ${photo ? "absolute top-3 left-3 text-left text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]" : "mt-3 text-neutral-600"}`}
          >
            You and {name}
            <span className="mt-1 block">Apple Photos, or send your own</span>
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => usePhoto(event.target.files?.[0])}
            />
          </label>
        </div>

        <section className={`${tile} col-span-2 bg-white px-4 py-3 text-lg sm:col-span-6 sm:px-5`}>
          <Mark>Go early</Mark>. The good bread is gone by ten.
        </section>

        <section className={`${tile} col-span-2 bg-[#fff04a] p-4 sm:col-span-4 sm:p-5`}>
          <p className="text-xs">Fun fact</p>
          <p className="mt-3 font-serif text-3xl italic leading-tight sm:text-4xl">
            You walk faster when you&apos;re talking.
          </p>
        </section>
        <section className={`${tile} col-span-2 bg-white p-4 sm:col-span-2 sm:p-5`}>
          <p className="text-xs">Rec</p>
          <h2 className="mt-2 text-2xl">Early show</h2>
          <p className="mt-3 text-base leading-7">
            You&apos;ll go if it isn&apos;t a whole night. I&apos;ll get the
            tickets.
          </p>
        </section>

        <Photo
          caption="Left out"
          src="/postcard/left-out.jpg"
          imgClassName="object-[32%_center]"
          onOpen={setView}
          className="col-span-2 aspect-[4/3] sm:col-span-2 sm:aspect-[3/4]"
        />
        <section className={`${tile} col-span-2 bg-white p-4 text-base leading-7 sm:col-span-4 sm:p-5 sm:text-lg sm:leading-8`}>
          The project finally moved. You asked last time, {name}, so here it is{" "}
          <Mark tone="pink">without the spiral</Mark>. I still don&apos;t know
          what <Cut>Friday</Cut> was for. It can stay that way. The jacket is
          still on the chair, which is the part I didn&apos;t text.
        </section>

        <Photo
          caption="On the way home"
          src="/postcard/home.jpg"
          imgClassName="object-[20%_center]"
          onOpen={setView}
          className="col-span-2 h-48 sm:col-span-4 sm:h-auto"
        />
        <section className={`${tile} col-span-2 bg-white p-4 text-base leading-7 sm:col-span-2 sm:p-5 sm:text-lg sm:leading-8`}>
          Empty street. I almost sent this from the sidewalk, then{" "}
          <Cut>didn&apos;t</Cut>. It&apos;s here instead, {name}. The lamp was
          already on. You would have asked which block, and I still
          wouldn&apos;t have had a good answer.
        </section>

        <section className={`${tile} col-span-2 flex min-h-36 items-center justify-center bg-white sm:col-span-2`}>
          <span className="absolute top-3 left-4 text-xs">Saved</span>
          <p className="text-4xl">
            <Mark>{birthday.when}</Mark>
          </p>
        </section>

        <section className={`${tile} col-span-2 bg-white p-4 sm:col-span-4`}>
          <ul>
            {birthdays.map((item) => {
              const open = item.id === openBirthday;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => setOpenBirthday(item.id)}
                    className="flex w-full items-baseline justify-between gap-4 py-1.5 text-left text-sm"
                  >
                    <span>{item.label(name)}</span>
                    <span className="text-xs">{item.when}</span>
                  </button>
                  {open ? (
                    <p className="pb-2 text-xs leading-5">{item.note(name)}</p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      </div>
      {view ? (
        <Viewer
          src={view.src}
          caption={view.caption}
          onClose={() => setView(null)}
        />
      ) : null}
    </main>
  );
}

function Mark({
  children,
  tone = "yellow",
}: {
  children: ReactNode;
  tone?: "yellow" | "pink";
}) {
  const bg = tone === "pink" ? "bg-[#ffb7d5]" : "bg-[#fff04a]";
  return (
    <mark
      className={`${bg} box-decoration-clone px-1 text-inherit [box-decoration-break:clone]`}
    >
      {children}
    </mark>
  );
}

function Cut({ children }: { children: ReactNode }) {
  return (
    <s className="text-black decoration-black decoration-[3px] [text-decoration-skip-ink:none]">
      {children}
    </s>
  );
}

function Photo({
  caption,
  src,
  onOpen,
  className = "",
  imgClassName = "",
}: {
  caption: string;
  src: string;
  onOpen: (photo: { src: string; caption: string }) => void;
  className?: string;
  imgClassName?: string;
}) {
  return (
    <button
      type="button"
      aria-label={`Expand ${caption}`}
      onClick={() => onOpen({ src, caption })}
      className={`${tile} h-full min-h-40 cursor-pointer overflow-hidden bg-neutral-200 text-left ${className}`}
    >
      <img
        src={src}
        alt=""
        className={`absolute inset-0 h-full w-full object-cover ${imgClassName}`}
      />
      <span className="absolute top-3 right-3 left-3 text-xs text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]">
        {caption}
      </span>
    </button>
  );
}

function Viewer({
  src,
  caption,
  onClose,
}: {
  src: string;
  caption: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={caption}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 sm:p-10"
      onClick={onClose}
    >
      <div
        className="relative max-h-[80svh] w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <img
          src={src}
          alt={caption}
          className="max-h-[80svh] w-full rounded-2xl object-contain"
        />
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center text-3xl leading-none text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.7)]"
        >
          ×
        </button>
        <p className="pointer-events-none absolute inset-x-0 bottom-0 rounded-b-2xl bg-gradient-to-t from-black/70 to-transparent px-5 pt-12 pb-4 text-base text-white">
          {caption}
        </p>
      </div>
    </div>
  );
}
