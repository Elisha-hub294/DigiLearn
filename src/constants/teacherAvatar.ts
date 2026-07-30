export const OPERO_STEPHEN_AVATAR =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/opero-stephen.jpeg";

export const DEFAULT_TEACHER_AVATAR =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/tr-default.png";

export function getTeacherAvatar(teacherName?: string) {
  return teacherName?.trim().toLowerCase() === "opero stephen"
    ? OPERO_STEPHEN_AVATAR
    : DEFAULT_TEACHER_AVATAR;
}
