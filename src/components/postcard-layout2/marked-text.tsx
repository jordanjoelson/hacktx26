"use client";

import { RoughNotation } from "react-rough-notation";

const MARK = /(==.+?==|~~.+?~~|__.+?__)/g;

/**
 * Renders text with inline marks: ==highlight==, ~~crossed out~~, __underlined__.
 * Use them sparingly. Highlights and cross-outs are CSS on the words themselves,
 * so they always line up with the text; underlines are hand-drawn and play
 * when the page's <RoughNotationGroup> shows.
 */
export function MarkedText({ text }: { text: string }) {
  return (
    <>
      {text.split(MARK).map((part, i) => {
        if (part.startsWith("==")) {
          return (
            <mark key={i} className="l2-highlight">
              {part.slice(2, -2)}
            </mark>
          );
        }
        if (part.startsWith("~~")) {
          return (
            <s key={i} className="l2-strike">
              {part.slice(2, -2)}
            </s>
          );
        }
        if (part.startsWith("__")) {
          return (
            <RoughNotation key={i} type="underline" color="#0047ab" strokeWidth={2} padding={1} iterations={1} animationDuration={600}>
              {part.slice(2, -2)}
            </RoughNotation>
          );
        }
        return part;
      })}
    </>
  );
}
