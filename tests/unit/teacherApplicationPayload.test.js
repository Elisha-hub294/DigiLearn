const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildTeacherApplicationProfile,
} = require("../../src/utils/teacherApplicationPayload.js");

test("buildTeacherApplicationProfile includes photoURL and selected social metadata", () => {
  const payload = buildTeacherApplicationProfile({
    applicantId: "teacher-123",
    name: "Jane Teacher",
    email: "jane@example.com",
    school: "Green Valley High",
    subjects: ["Mathematics", "Physics"],
    filterFeedByInterests: true,
    photoURL: "https://cdn.example.com/profile.png",
    socials: {
      "socials-email": "teacher@example.com",
      "socials-youtube": "https://youtube.com/@jane",
    },
  });

  assert.equal(payload.applicantId, "teacher-123");
  assert.equal(payload.photoURL, "https://cdn.example.com/profile.png");
  assert.deepEqual(payload.subjects, ["Mathematics", "Physics"]);
  assert.equal(payload["socials-email"], "teacher@example.com");
  assert.equal(payload["socials-youtube"], "https://youtube.com/@jane");
});
