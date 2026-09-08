export function buildTeacherApplicationProfile(
  data: {
    applicantId?: string;
    name?: string;
    email?: string;
    school?: string;
    subjects?: string[];
    filterFeedByInterests?: boolean;
    photoURL?: string;
    socials?: Record<string, string>;
  } = {},
) {
  const {
    applicantId,
    name,
    email,
    school,
    subjects = [],
    filterFeedByInterests = false,
    photoURL,
    socials = {},
  } = data;

  return {
    applicantId,
    name,
    email,
    school,
    subjects,
    filterFeedByInterests,
    ...(photoURL ? { photoURL } : {}),
    ...Object.fromEntries(
      Object.entries(socials).filter(
        ([, value]) => typeof value === "string" && value.trim(),
      ),
    ),
  };
}
