const test = require("node:test");
const assert = require("node:assert/strict");

const {
  buildTeacherProfileRouteParams,
} = require("../../src/utils/bookAuthorNavigation.js");

test("buildTeacherProfileRouteParams includes teacher ID when available", () => {
  const params = buildTeacherProfileRouteParams("Alice Johnson", {
    "alice johnson": "teacher-123",
  });

  assert.deepEqual(params, {
    id: "teacher-123",
    name: "Alice Johnson",
  });
});

test("buildTeacherProfileRouteParams falls back to name-only navigation", () => {
  const params = buildTeacherProfileRouteParams("Unknown Teacher", {});

  assert.deepEqual(params, {
    name: "Unknown Teacher",
  });
});
