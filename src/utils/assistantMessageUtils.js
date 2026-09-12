const DEFAULT_ASSISTANT_FALLBACK_MESSAGE = "Need help with your studies?";

function normalizeAssistantMessage(
  value,
  fallback = DEFAULT_ASSISTANT_FALLBACK_MESSAGE,
) {
  const trimmed = typeof value === "string" ? value.trim() : "";
  return trimmed.length > 0 ? trimmed : fallback;
}

function sanitizeAssistantMessages(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  const sanitized = values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);

  return Array.from(new Set(sanitized));
}

module.exports = {
  DEFAULT_ASSISTANT_FALLBACK_MESSAGE,
  normalizeAssistantMessage,
  sanitizeAssistantMessages,
};
