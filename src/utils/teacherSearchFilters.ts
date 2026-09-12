export function isApprovedTeacher(teacher: unknown): boolean {
  if (!teacher || typeof teacher !== "object") return false;
  const record = teacher as Record<string, unknown>;
  const approvalStatus = record.teacherApprovalStatus;
  if (approvalStatus === "approved") return true;
  if (typeof record.verified === "boolean") return record.verified;
  return false;
}

export function filterApprovedTeachers<T extends Record<string, unknown>>(
  teachers: T[],
): T[] {
  if (!Array.isArray(teachers)) return [];
  return teachers.filter((teacher) => isApprovedTeacher(teacher));
}
