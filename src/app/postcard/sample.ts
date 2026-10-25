import type { PostcardData } from "@/components/postcard-layout1/types";

// A sample week. Text supports a few inline marks, drawn by hand on the page.
// Use them sparingly:   ==highlight==   ~~crossed out~~   __underlined__
export const samplePostcard: PostcardData = {
  to: "Maya",
  from: "Toni",
  issue: 43,
  tags: ["Walking", "One long dinner", "Bookstore"],
  dates: "Oct 19 – 25",
  notes: [
    "The week was mostly ==walking== and one long dinner. I almost ~~left it out~~, then kept it because you would have asked.",
    "This is the short version, the one you can read on a train. The part I still have is the walk after, when it got quiet. You stopped at every window. I kept the pace, which is the opposite of how this usually goes.",
    "Dinner ran long in the best way. Nobody checked the time, and the candle was half gone before anyone noticed. The bread came out warm and disappeared almost as fast.",
  ],
  later: [
    "The project finally moved. You asked last time, so here it is, ==without the spiral==. I still don't know what Friday was for. It can stay that way.",
    "Empty street on the way home. I almost sent this from the sidewalk, then didn't. The lamp was already on. You would have asked which block.",
  ],
  photos: [
    { id: "thursday", src: "/postcard/thursday.jpg", caption: "thursday", focus: "left" },
    { id: "dinner", src: "/postcard/dinner.jpg", caption: "the dinner", note: "this one" },
    { id: "home", src: "/postcard/home.jpg", caption: "on the way home", focus: "20% center" },
    { id: "left-out", src: "/postcard/left-out.jpg", caption: "almost left out", focus: "32% center" },
    { id: "walk", src: "/postcard/art-walk.png", caption: "the long way" },
    // Photos past the ones placed on the pages go into the flip-through stack.
    { id: "jump", src: "/postcard/art-jump.png", caption: "friday" },
    { id: "view", src: "/landscape.jpg", caption: "sunday view" },
    { id: "window", src: "/postcard/thursday.jpg", caption: "every window", focus: "right" },
  ],
  recs: [
    {
      kind: "Rec",
      title: "Bookstore",
      body: "The corner one. Go on a weekday, before the tables fill. There's a chair by the window you'd take without asking.",
    },
  ],
  ticket: { title: "Early show", line: "You'll go if it isn't a whole night. I'll get the tickets.", when: "SAT · 6:30" },
  funFact: "You walk faster when you're talking.",
  tip: "p.s. __go early__. The good bread is gone by ten.",
  saved: [
    { label: "Maya's birthday", when: "Jun 14", note: "You usually send something small." },
    { label: "Sam", when: "Mar 3", note: "Flagged this one too." },
    { label: "Alex", when: "Nov 19", note: "Maya was there last year." },
  ],
  signoff: "See you soon,",
};
