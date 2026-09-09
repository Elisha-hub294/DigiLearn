const test = require("node:test");
const assert = require("node:assert/strict");
const {
  canResubmitTeacherApplication,
} = require("../../src/utils/teacherResubmission.js");

test("teacher re-submission is allowed only when the admin permits it", () => {
  assert.equal(canResubmitTeacherApplication({ status: "rejected" }), false);
  assert.equal(
    canResubmitTeacherApplication({ status: "rejected", allowReapply: true }),
    true,
  );
  assert.equal(
    canResubmitTeacherApplication({ status: "rejected", allowReapply: false }),
    false,
  );
  assert.equal(canResubmitTeacherApplication({ status: "approved" }), false);
});
