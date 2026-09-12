const test = require("node:test");
const assert = require("node:assert/strict");

const {
  resolveTeacherPublisherProfile,
} = require("../../src/utils/teacherNotificationPublisher.js");

test("teacher-published resources keep the teacher profile in notification metadata", () => {
  const publisher = resolveTeacherPublisherProfile({
    type: "teacher",
    name: "Jane Teacher",
    avatar: "https://cdn.example.com/jane.png",
    photoURL: "https://cdn.example.com/alt.png",
  });

  assert.deepEqual(publisher, {
    publisherName: "Jane Teacher",
    publisherAvatar: "https://cdn.example.com/jane.png",
  });
});

test("non-teacher profiles fall back to the default DigiLearn publisher", () => {
  const publisher = resolveTeacherPublisherProfile({
    type: "student",
    name: "Student User",
    photoURL: "https://cdn.example.com/student.png",
  });

  assert.equal(publisher.publisherName, "OS platform");
  assert.equal(publisher.publisherAvatar, "@/assets/images/panda.png");
});
