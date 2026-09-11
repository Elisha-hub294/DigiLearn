import assert from "node:assert/strict";
import test from "node:test";

import { shouldSkipStartupSuggestionGeneration } from "../../src/services/aiStartupGuard.ts";

test("startup suggestions are skipped after the daily AI cap is exhausted", () => {
  assert.equal(
    shouldSkipStartupSuggestionGeneration({
      allowed: false,
      remainingQuota: 0,
      dailyLimit: 15,
      errorMessage:
        "You've reached your daily limit of 15 AI questions. It resets at midnight!",
    }),
    true,
  );
});

test("startup suggestions stay enabled when the block is only a short cooldown", () => {
  assert.equal(
    shouldSkipStartupSuggestionGeneration({
      allowed: false,
      remainingQuota: 12,
      dailyLimit: 15,
      errorMessage: "Please wait 3s before asking another question.",
    }),
    false,
  );
});
