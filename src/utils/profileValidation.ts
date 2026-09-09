const PROFILE_TEXT_INVALID = /[^\p{L}\p{M}\p{N} .,'&()\-]/u;

export const MAX_PROFILE_FIELD_LENGTH = 50;

export function sanitizeProfileText(value: string): string {
  return value
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[^\p{L}\p{M}\p{N} .,'&()\-]/gu, "")
    .replace(/\s+/g, " ");
}

export function normalizeProfileText(value: string): string {
  return sanitizeProfileText(value).trim();
}

export function validateProfileText(value: string, label: string): string {
  if (!value) {
    return `${label} is required.`;
  }

  if (value.length > MAX_PROFILE_FIELD_LENGTH) {
    return `${label} must be ${MAX_PROFILE_FIELD_LENGTH} characters or fewer.`;
  }

  if (PROFILE_TEXT_INVALID.test(value)) {
    return `${label} contains unsupported characters.`;
  }

  if (!/[\p{L}\p{N}]/u.test(value)) {
    return `${label} must contain at least one letter or number.`;
  }

  return "";
}
