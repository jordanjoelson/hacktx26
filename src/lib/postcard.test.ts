// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { applyEdits, SAMPLE_POSTCARD } from "./postcard.ts";

test("applies text edits", () => {
  const next = applyEdits(SAMPLE_POSTCARD, { ...SAMPLE_POSTCARD, to: "Sam", recs: [{ title: "Park", body: "Go." }] });
  assert.equal(next.to, "Sam");
  assert.deepEqual(next.recs[0], { title: "Park", body: "Go." });
  assert.deepEqual(next.recs[1], SAMPLE_POSTCARD.recs[1]);
});

test("keeps locked fields, shape, and array lengths", () => {
  const next = applyEdits(SAMPLE_POSTCARD, {
    photos: [{ src: "https://evil.example/x.jpg", caption: "New" }],
    stories: ["a", "b", "c", "extra"],
    extra: "nope",
    tip: 42,
  });
  assert.equal(next.photos[0]!.src, SAMPLE_POSTCARD.photos[0]!.src);
  assert.equal(next.photos[0]!.caption, "New");
  assert.equal(next.stories.length, 3);
  assert.equal("extra" in next, false);
  assert.equal(next.tip, SAMPLE_POSTCARD.tip);
});

test("ignores garbage and caps long text", () => {
  assert.deepEqual(applyEdits(SAMPLE_POSTCARD, null), SAMPLE_POSTCARD);
  assert.equal(applyEdits(SAMPLE_POSTCARD, { to: "x".repeat(5000) }).to.length, 2000);
});
