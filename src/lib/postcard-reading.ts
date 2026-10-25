import { storyPhotoIndexes, type PostcardContent } from "./postcard.ts";

/** Use the same recipient substitution as the page, without reading formatting aloud. */
export function plainPostcardText(text: string, name: string): string {
  return text.replaceAll("{name}", name).replace(/~~[\s\S]*?~~/g, "").replace(/\|\|[\s\S]*?\|\|/g, "(spoiler)")
    .replace(/==([\s\S]*?)==|\+\+([\s\S]*?)\+\+|\*\*([\s\S]*?)\*\*/g, "$1$2$3")
    .replace(/\s+/g, " ").trim();
}

export function postcardNarration(content: PostcardContent): string {
  const stories = content.stories.map((story, index) => ({ story, index }))
    .filter(({ story }) => story.trim());
  const usedPhotos = new Set(stories.flatMap(({ index }) => storyPhotoIndexes(content, index)));
  const storyParts = ({ story, index }: { story: string; index: number }) =>
    [content.storyTitles?.[index], story, ...storyPhotoIndexes(content, index).map((i) => content.photos[i]?.caption)];
  const parts = [
    `A postcard from ${content.from || "a friend"}, for ${content.to || "you"}.`,
    content.period, content.title, content.intro, content.opener,
    ...(stories[0] ? storyParts(stories[0]) : []),
    content.funFact,
    ...stories.slice(1).flatMap(storyParts),
    ...content.photos.filter((_, index) => !usedPhotos.has(index)).map((photo) => photo.caption),
    ...content.recs.flatMap((rec) => [rec.title, rec.body]),
    content.tip,
    ...content.dates.flatMap((date) => [date.label, date.when, date.note]),
  ];
  return parts.filter((part): part is string => Boolean(part?.trim()))
    .map((part) => plainPostcardText(part, content.to.trim() || "you"))
    .filter(Boolean).join("\n\n");
}

/** Short utterances avoid long uninterrupted speech requests; never split a word. */
export function speechChunks(text: string): string[] {
  const chunks: string[] = [];
  for (const paragraph of text.split(/\n+/).filter(Boolean)) {
    let chunk = "";
    for (const word of paragraph.split(/\s+/)) {
      if (chunk && chunk.length + word.length + 1 > 220) {
        chunks.push(chunk);
        chunk = "";
      }
      chunk += `${chunk ? " " : ""}${word}`;
    }
    if (chunk) chunks.push(chunk);
  }
  return chunks;
}
