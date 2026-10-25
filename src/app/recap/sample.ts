import type { PostcardData } from "@/components/postcard-layout1/types";

// Toni's week, the same one as the sample recap. Text supports a few inline marks.
// Use them sparingly:   ==highlight==   ~~crossed out~~   __underlined__
export const samplePostcard: PostcardData = {
  to: "Maya",
  from: "Toni",
  issue: 43,
  tags: ["Texas Tech", "A rainbow", "HackTX"],
  dates: "Oct 19 – 25",
  notes: [
    "We won a Texas Tech hackathon. Four of us, four monitors, and a gold ==HACKATHON WINNER== pin I held longer than I needed to.",
    "Then I left the building. A full rainbow on a walk, an afternoon at the range, and one more try on the bouldering wall.",
  ],
  later: [
    "Symphony with my family, a breakfast I actually made, and a table of sushi that did not stay full.",
    "HackTX opening night. ==Starting Soon== on a very large screen, and Indian food on a paper plate that was better than it had any right to be.",
  ],
  photos: [
    { id: "win", src: "/week/IMG_0617.jpeg", caption: "right after" },
    { id: "pin", src: "/week/IMG_3353.jpeg", caption: "the pin", note: "this one" },
    { id: "rainbow", src: "/week/IMG_3446.jpeg", caption: "stopped for this" },
    { id: "opening", src: "/week/IMG_3789.jpeg", caption: "starting soon" },
    { id: "symphony", src: "/week/IMG_3667.jpeg", caption: "with my family" },
    { id: "range", src: "/week/IMG_3621.jpeg", caption: "range day" },
    { id: "boulder", src: "/week/IMG_3744.jpeg", caption: "back on the wall" },
    { id: "breakfast", src: "/week/IMG_3682.jpeg", caption: "the responsible one" },
    { id: "sushi", src: "/week/IMG_3780.jpeg", caption: "the table" },
    { id: "indian", src: "/week/IMG_3798.jpeg", caption: "hacktx dinner" },
  ],
  recs: [
    {
      kind: "Rec",
      title: "Oumi",
      body: "The sushi dinner. Go hungry. The salmon is the one to fight for.",
    },
  ],
  ticket: { title: "HackTX", line: "Opening night is done. The building part is the rest.", when: "THIS WEEKEND" },
  funFact: "The pin is heavier than it looks.",
  tip: "p.s. __don't skip the paper plate__. It was the best meal of the hackathon.",
  saved: [
    { label: "HackTX", when: "This weekend", note: "I'll tell you what we build once we've slept." },
  ],
  signoff: "More soon,",
};
