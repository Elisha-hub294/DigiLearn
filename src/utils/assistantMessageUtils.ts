export const DEFAULT_ASSISTANT_FALLBACK_MESSAGE =
  "Need help with your studies?";

export function normalizeAssistantMessage(
  value: string | null | undefined,
  fallback = DEFAULT_ASSISTANT_FALLBACK_MESSAGE,
): string {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function sanitizeAssistantMessages(
  values: Array<string | null | undefined> | null | undefined,
): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const sanitized = values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter((value) => value.length > 0);

  return Array.from(new Set(sanitized));
}
