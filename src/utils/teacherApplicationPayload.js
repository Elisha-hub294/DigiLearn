function buildTeacherApplicationProfile(data = {}) {
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

module.exports = {
  buildTeacherApplicationProfile,
};
