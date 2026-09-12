const test = require("node:test");
const assert = require("node:assert/strict");
const {
  canChangeAccountType,
  getAccountTypeChangeError,
} = require("../../src/utils/accountTypeRules.js");

test("blocks changing to the same account type", () => {
  assert.equal(canChangeAccountType("teacher", "teacher"), false);
  assert.equal(canChangeAccountType("student", "student"), false);
  assert.equal(canChangeAccountType("student", "teacher"), true);
});

test("returns a clear message when the user chooses the same account type", () => {
  assert.match(
    getAccountTypeChangeError("teacher"),
    /already have a teacher account/i,
  );
});
