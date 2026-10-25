export interface PostcardPhoto {
  id: string;
  src: string;
  caption: string;
  /** CSS object-position, e.g. "left" or "20% center". */
  focus?: string;
  /** Short note shown under the photo. */
  note?: string;
}

export interface PostcardData {
  to: string;
  from: string;
  issue: number;
  /** A few words that sum up the week, shown as chips. */
  tags?: string[];
  dates: string;
  /** Page 1 paragraphs. */
  notes: string[];
  /** Page 2 paragraphs. */
  later: string[];
  photos: PostcardPhoto[];
  recs: { kind: string; title: string; body: string }[];
  ticket: { title: string; line: string; when: string };
  funFact: string;
  tip: string;
  saved: { label: string; when: string; note: string }[];
  signoff: string;
}
