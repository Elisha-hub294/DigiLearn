function canResubmitTeacherApplication(application = {}) {
  if (!application || typeof application !== "object") {
    return false;
  }

  if (application.status !== "rejected") {
    return false;
  }

  return application.allowReapply === true;
}

module.exports = {
  canResubmitTeacherApplication,
};
