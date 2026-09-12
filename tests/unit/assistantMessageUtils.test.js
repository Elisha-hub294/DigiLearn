const assert = require("node:assert/strict");
const test = require("node:test");

const {
  normalizeAssistantMessage,
  sanitizeAssistantMessages,
} = require("../../src/utils/assistantMessageUtils.js");

test("assistant message sanitization removes blank and whitespace-only entries", () => {
  assert.deepEqual(
    sanitizeAssistantMessages([" Hi ", "", "   ", "Study tip", "\n"]),
    ["Hi", "Study tip"],
  );
});

test("assistant message normalization falls back to a safe default when blank", () => {
  assert.equal(
    normalizeAssistantMessage("   "),
    "Need help with your studies?",
  );
  assert.equal(normalizeAssistantMessage(" Plan your week "), "Plan your week");
});
