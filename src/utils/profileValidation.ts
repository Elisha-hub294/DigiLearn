const PROFILE_TEXT_ALLOWED = /[^\p{L}\p{N} ]/gu;

export function normalizeProfileText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .replace(PROFILE_TEXT_ALLOWED, "")
    .replace(/ +/g, " ")
    .trim();
}

export function validateProfileText(value: string, label: string): string {
  if (!value) {
    return `${label} is required.`;
  }

  if (!/[\p{L}\p{N}]/u.test(value)) {
    return `${label} must contain at least one letter or number.`;
  }

  return "";
}
