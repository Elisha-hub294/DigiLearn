export function isApprovedTeacher(teacher: unknown): boolean {
  if (!teacher || typeof teacher !== "object") return false;
  const record = teacher as Record<string, unknown>;
  return record.teacherApprovalStatus === "approved";
}

export function filterApprovedTeachers<T extends Record<string, unknown>>(
  teachers: T[],
): T[] {
  if (!Array.isArray(teachers)) return [];
  return teachers.filter((teacher) => isApprovedTeacher(teacher));
}
