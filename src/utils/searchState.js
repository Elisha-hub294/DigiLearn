function normalizeSearchInput(value) {
  return typeof value === "string" ? value.trim() : "";
}

function shouldClearSubmittedSearch(value, hasSubmittedSearch) {
  if (!hasSubmittedSearch) return false;
  return normalizeSearchInput(value) === "";
}

module.exports = {
  normalizeSearchInput,
  shouldClearSubmittedSearch,
};
