import type { PostcardContent, PostcardFormat, PostcardLabelKey } from "@/lib/postcard";

/** Each format's default wording for its section labels. A sender's own wording (style.labels) wins in every format. */
const DEFAULT_LABELS: Record<PostcardFormat, Record<PostcardLabelKey, string>> = {
  blog: {
    opener: "Before you read",
    funFact: "A small realization",
    recs: "Thought you'd like these",
    tip: "P.S.",
    dates: "Coming up",
    later: "Saved for later",
    signoff: "Until next time,",
  },
  paper: {
    opener: "Before you read",
    funFact: "Fun fact",
    recs: "Rec",
    tip: "p.s.",
    dates: "Dates worth remembering",
    later: "Saved for later",
    signoff: "See you soon,",
  },
  grid: {
    opener: "Before you read",
    funFact: "Fun fact",
    recs: "Recommended",
    tip: "P.S.",
    dates: "Coming up",
    later: "Saved for later",
    signoff: "See you soon,",
  },
};

/** The label to show for `key` in `format`. */
export function labelFor(content: PostcardContent, format: PostcardFormat, key: PostcardLabelKey): string {
  return content.style?.labels?.[key] || DEFAULT_LABELS[format][key];
}

/**
 * An onChange for a label, or undefined when the postcard isn't being edited. The raw text is kept while
 * typing (so clearing a label to retype it doesn't snap back); an empty label shows the default and is
 * dropped when saved.
 */
export function labelEditor(
  content: PostcardContent,
  onChange: ((next: PostcardContent) => void) | undefined,
  key: PostcardLabelKey,
): ((value: string) => void) | undefined {
  if (!onChange) return undefined;
  return (value: string) => onChange({ ...content, style: { ...content.style, labels: { ...content.style?.labels, [key]: value } } });
}

/** The value a label's edit field should hold: the sender's text if they've typed one (even empty), else the default. */
export function labelValue(content: PostcardContent, format: PostcardFormat, key: PostcardLabelKey): string {
  const own = content.style?.labels?.[key];
  return own ?? DEFAULT_LABELS[format][key];
}
