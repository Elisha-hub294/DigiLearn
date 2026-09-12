const test = require("node:test");
const assert = require("node:assert/strict");
const {
  filterApprovedTeachers,
  isApprovedTeacher,
} = require("../../src/utils/teacherSearchFilters.js");

test("filterApprovedTeachers excludes teachers not approved by admin", () => {
  const teachers = [
    {
      id: "1",
      name: "Approved Teacher",
      type: "teacher",
      teacherApprovalStatus: "approved",
    },
    {
      id: "2",
      name: "Pending Teacher",
      type: "teacher",
      teacherApprovalStatus: "pending",
    },
    {
      id: "3",
      name: "Rejected Teacher",
      type: "teacher",
      teacherApprovalStatus: "rejected",
    },
    { id: "4", name: "Legacy Teacher", type: "teacher" },
    { id: "5", name: "Verified Teacher", type: "teacher", verified: true },
  ];

  const approved = filterApprovedTeachers(teachers);

  assert.deepEqual(
    approved.map((teacher) => teacher.id),
    ["1", "5"],
  );
  assert.equal(isApprovedTeacher(teachers[1]), false);
  assert.equal(isApprovedTeacher(teachers[3]), false);
  assert.equal(isApprovedTeacher(teachers[4]), true);
});
