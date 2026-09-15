function normalizeKey(value = "") {
  return String(value).trim().toLowerCase();
}

function buildTeacherProfileRouteParams(name, teacherIdsByName = {}) {
  const trimmedName = typeof name === "string" ? name.trim() : "";
  if (!trimmedName) {
    return {};
  }

  const normalizedName = normalizeKey(trimmedName);
  const teacherId =
    teacherIdsByName[normalizedName] || teacherIdsByName[trimmedName];

  if (!teacherId) {
    return { name: trimmedName };
  }

  return {
    id: teacherId,
    name: trimmedName,
  };
}

module.exports = {
  buildTeacherProfileRouteParams,
};
