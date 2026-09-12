const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeSearchInput,
  shouldClearSubmittedSearch,
} = require("../../src/utils/searchState.js");

test("normalizeSearchInput trims whitespace without dropping valid queries", () => {
  assert.equal(normalizeSearchInput("   biology   "), "biology");
  assert.equal(normalizeSearchInput("   "), "");
  assert.equal(normalizeSearchInput("algebra"), "algebra");
});

test("shouldClearSubmittedSearch only resets when the field is truly empty", () => {
  assert.equal(shouldClearSubmittedSearch("   ", true), true);
  assert.equal(shouldClearSubmittedSearch("biology", true), false);
  assert.equal(shouldClearSubmittedSearch("", false), false);
});
