import assert from "node:assert/strict";
import { test } from "node:test";
import { plainPostcardText, postcardNarration, speechChunks } from "./postcard-reading.ts";
import { SAMPLE_POSTCARD, type PostcardContent } from "./postcard.ts";

test("narration resolves names and emphasis without reading crossed-out text", () => {
  assert.equal(plainPostcardText("{name}, ==Friday== was ++lovely++. ~~Actually, no.~~", "Maya"), "Maya, Friday was lovely.");
});

test("older postcards work without editorial fields and empty sections", () => {
  const legacy: PostcardContent = { from: "Jo", to: "Lee", stories: ["A small update."], photos: [], recs: [], dates: [], tip: "", funFact: "" };
  assert.equal(postcardNarration(legacy), "A postcard from Jo, for Lee.\n\nA small update.");
});

test("all variable-length sections are narrated in the edition's reading order", () => {
  const content = structuredClone(SAMPLE_POSTCARD);
  content.stories.push("A fourth story.", "A fifth story.");
  content.recs.push({ title: "A third recommendation", body: "Don't lose this one." });
  const text = postcardNarration(content);
  assert(text.includes("A fifth story."));
  assert(text.includes("A third recommendation"));
  assert(text.indexOf(content.stories[0].slice(0, 25)) < text.indexOf(content.funFact));
  assert(text.indexOf(content.funFact) < text.indexOf(content.stories[1].slice(0, 25)));
  assert(!text.includes("{name}"));
});

test("speech chunks preserve words and avoid long utterances", () => {
  const text = postcardNarration(SAMPLE_POSTCARD);
  const chunks = speechChunks(text);
  assert(chunks.every((chunk) => chunk.length <= 220));
  assert.equal(chunks.join(" "), text.replace(/\s+/g, " "));
  assert.deepEqual(speechChunks(""), []);
});
