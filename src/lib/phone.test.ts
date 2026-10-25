// Run with: npm test
import assert from "node:assert/strict";
import { test } from "node:test";
import { toE164 } from "./phone.ts";

test("normalizes US numbers", () => {
  assert.equal(toE164("(512) 555-0123"), "+15125550123");
  assert.equal(toE164("+1 512 555 0123"), "+15125550123");
  assert.equal(toE164("15125550123"), "+15125550123");
});

test("rejects everything else", () => {
  for (const bad of ["", "555-0123", "+44 20 7946 0958", "(012) 555-0123", "512 155 0123", "abc"]) {
    assert.equal(toE164(bad), undefined, bad);
  }
});
