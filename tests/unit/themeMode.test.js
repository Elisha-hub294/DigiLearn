const test = require("node:test");
const assert = require("node:assert/strict");

const { resolveInitialThemeMode } = require("../../src/utils/themeMode");

test("prefers a stored theme mode when available", () => {
  assert.equal(resolveInitialThemeMode("dark", "light"), "dark");
  assert.equal(resolveInitialThemeMode("light", "dark"), "light");
});

test("falls back to the system color scheme when no stored theme is set", () => {
  assert.equal(resolveInitialThemeMode(null, "dark"), "dark");
  assert.equal(resolveInitialThemeMode(null, "light"), "light");
});

test("defaults to light when the system scheme is unavailable", () => {
  assert.equal(resolveInitialThemeMode(null, undefined), "light");
});
