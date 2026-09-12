const DEFAULT_PUBLISHER_NAME = "OS platform";
const DEFAULT_PUBLISHER_AVATAR = "@/assets/images/panda.png";

function resolveTeacherPublisherProfile(profile = {}) {
  const isTeacherProfile =
    profile?.type === "teacher" ||
    profile?.teacherApprovalStatus === "approved" ||
    profile?.teacherApprovalStatus === "pending" ||
    profile?.teacherApprovalStatus === "rejected";

  if (!isTeacherProfile) {
    return {
      publisherName: DEFAULT_PUBLISHER_NAME,
      publisherAvatar: DEFAULT_PUBLISHER_AVATAR,
    };
  }

  const candidateName =
    typeof profile?.name === "string" && profile.name.trim()
      ? profile.name.trim()
      : "Teacher";

  const candidateAvatar =
    typeof profile?.avatar === "string" && profile.avatar.trim()
      ? profile.avatar.trim()
      : typeof profile?.photoURL === "string" && profile.photoURL.trim()
        ? profile.photoURL.trim()
        : DEFAULT_PUBLISHER_AVATAR;

  return {
    publisherName: candidateName,
    publisherAvatar: candidateAvatar,
  };
}

module.exports = {
  DEFAULT_PUBLISHER_NAME,
  DEFAULT_PUBLISHER_AVATAR,
  resolveTeacherPublisherProfile,
};
