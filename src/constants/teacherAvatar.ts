// Firebase Storage paths – resolved at runtime via getFirebaseStorageUrl / FirebaseImage
export const OPERO_STEPHEN_AVATAR = "TeacherProfile/opero-stephen.jpeg";
export const DEFAULT_TEACHER_AVATAR = "TeacherProfile/tr-default.png";
export const DEFAULT_USER_AVATAR = "TeacherProfile/user-default.png";

/**
 * Returns the Firebase Storage path for a teacher's avatar.
 * Pass this through `getFirebaseStorageUrl()` or render with `<FirebaseImage>`.
 */
export function getTeacherAvatar(teacherName?: string): string {
  return teacherName?.trim().toLowerCase() === "opero stephen"
    ? OPERO_STEPHEN_AVATAR
    : DEFAULT_TEACHER_AVATAR;
}
