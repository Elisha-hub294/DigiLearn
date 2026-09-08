function isApprovedTeacher(teacher) {
  if (!teacher || typeof teacher !== "object") return false;
  return teacher.teacherApprovalStatus === "approved";
}

function filterApprovedTeachers(teachers) {
  if (!Array.isArray(teachers)) return [];
  return teachers.filter((teacher) => isApprovedTeacher(teacher));
}

module.exports = {
  isApprovedTeacher,
  filterApprovedTeachers,
};
