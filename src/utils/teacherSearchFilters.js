function isApprovedTeacher(teacher) {
  if (!teacher || typeof teacher !== "object") return false;
  const approvalStatus = teacher.teacherApprovalStatus;
  if (approvalStatus === "approved") return true;
  if (typeof teacher.verified === "boolean") return teacher.verified;
  return false;
}

function filterApprovedTeachers(teachers) {
  if (!Array.isArray(teachers)) return [];
  return teachers.filter((teacher) => isApprovedTeacher(teacher));
}

module.exports = {
  isApprovedTeacher,
  filterApprovedTeachers,
};
