// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { applyEdits, SAMPLE_POSTCARD, storyPhotoIndexes } from "./postcard.ts";

test("applies text edits", () => {
  const next = applyEdits(SAMPLE_POSTCARD, { ...SAMPLE_POSTCARD, to: "Sam", recs: [{ title: "Park", body: "Go." }] });
  assert.equal(next.to, "Sam");
  assert.deepEqual(next.recs[0], { title: "Park", body: "Go.", url: SAMPLE_POSTCARD.recs[0]!.url });
  assert.deepEqual(next.recs[1], SAMPLE_POSTCARD.recs[1]);
});

test("keeps locked fields, shape, and array lengths", () => {
  const next = applyEdits(SAMPLE_POSTCARD, {
    photos: [{ src: "https://evil.example/x.jpg", caption: "New" }],
    stories: [...SAMPLE_POSTCARD.stories, "extra"],
    extra: "nope",
    tip: 42,
  });
  assert.equal(next.photos[0]!.src, SAMPLE_POSTCARD.photos[0]!.src);
  assert.equal(next.photos[0]!.caption, "New");
  assert.equal(next.stories.length, SAMPLE_POSTCARD.stories.length);
  assert.equal("extra" in next, false);
  assert.equal(next.tip, SAMPLE_POSTCARD.tip);
});

test("groups tagged photos by story, and pairs untagged photos by position", () => {
  const tagged = structuredClone(SAMPLE_POSTCARD);
  tagged.photos = [
    { src: "/a.jpg", caption: "", story: 1 },
    { src: "/b.jpg", caption: "", story: 0 },
    { src: "/c.jpg", caption: "", story: 1 },
    { src: "", caption: "", story: 1 },
  ];
  assert.deepEqual(storyPhotoIndexes(tagged, 0), [1]);
  assert.deepEqual(storyPhotoIndexes(tagged, 1), [0, 2]);
  assert.deepEqual(storyPhotoIndexes(tagged, 2), []);
  const legacy = structuredClone(SAMPLE_POSTCARD);
  legacy.photos = legacy.photos.map(({ src, caption }) => ({ src, caption }));
  assert.deepEqual(storyPhotoIndexes(legacy, 2), [2]);
});

test("never takes links or photo grouping from the browser", () => {
  const next = applyEdits(SAMPLE_POSTCARD, {
    recs: [{ title: "x", body: "y", url: "javascript:alert(1)" }],
    photos: [{ src: "/x.jpg", caption: "c", story: 2 }],
  });
  assert.equal(next.recs[0]!.url, SAMPLE_POSTCARD.recs[0]!.url);
  assert.equal(next.photos[0]!.story, SAMPLE_POSTCARD.photos[0]!.story);
});

test("ignores garbage and caps long text", () => {
  assert.deepEqual(applyEdits(SAMPLE_POSTCARD, null), SAMPLE_POSTCARD);
  assert.equal(applyEdits(SAMPLE_POSTCARD, { to: "x".repeat(5000) }).to.length, 2000);
});
