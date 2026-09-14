import * as WebBrowser from "expo-web-browser";
import { Linking } from "react-native";

/**
 * Extracts a normalized 10-character Google Meet code (e.g., 'abc-defg-hij')
 * from raw codes, URLs, or full meeting invitation text.
 */
export function extractGoogleMeetCode(input?: string | null): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // 1. Look for meet.google.com/<code-or-slug> pattern
  const urlMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?meet\.google\.com\/([a-zA-Z0-9_-]+)/i,
  );
  if (urlMatch?.[1]) {
    const rawSegment = urlMatch[1].toLowerCase().replace(/[^a-z0-9]/g, "");
    if (rawSegment.length === 10 && /^[a-z]{10}$/.test(rawSegment)) {
      return `${rawSegment.slice(0, 3)}-${rawSegment.slice(3, 7)}-${rawSegment.slice(7, 10)}`;
    }
    // Return original segment if it already matches xxx-yyyy-zzz
    const hyphenatedMatch = urlMatch[1]
      .toLowerCase()
      .match(/^([a-z]{3})-([a-z]{4})-([a-z]{3})$/);
    if (hyphenatedMatch) {
      return hyphenatedMatch[0];
    }
  }

  // 2. Look for standalone xxx-yyyy-zzz format
  const codeWithHyphens = trimmed
    .toLowerCase()
    .match(/\b([a-z]{3})-([a-z]{4})-([a-z]{3})\b/);
  if (codeWithHyphens?.[0]) {
    return codeWithHyphens[0];
  }

  // 3. Look for 10-letter contiguous sequence without hyphens as a distinct token (e.g. 'abcdefghij')
  const standaloneMatch = trimmed
    .toLowerCase()
    .match(/\b([a-z]{10})\b/);
  if (standaloneMatch?.[1]) {
    const raw = standaloneMatch[1];
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 10)}`;
  }

  return null;
}

/**
 * Formats a Google Meet code or URL into a canonical https://meet.google.com URL.
 */
export function formatGoogleMeetUrl(codeOrUrl?: string | null): string {
  if (!codeOrUrl || typeof codeOrUrl !== "string") return "";
  const trimmed = codeOrUrl.trim();
  if (!trimmed) return "";

  const extractedCode = extractGoogleMeetCode(trimmed);
  if (extractedCode) {
    return `https://meet.google.com/${extractedCode}`;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  if (trimmed.includes("meet.google.com")) {
    return `https://${trimmed}`;
  }

  return `https://meet.google.com/${trimmed}`;
}

export type GoogleMeetValidationResult = {
  isValid: boolean;
  code?: string;
  url?: string;
  error?: string;
};

/**
 * Validates teacher input for Google Meet coordinates (meeting code or URL).
 */
export function validateGoogleMeetInput(
  input?: string | null,
): GoogleMeetValidationResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      error: "Google Meet invitation code or link is required.",
    };
  }

  const code = extractGoogleMeetCode(input);
  if (!code) {
    return {
      isValid: false,
      error:
        "Please enter a valid Google Meet code (e.g. abc-defg-hij) or meeting link.",
    };
  }

  return {
    isValid: true,
    code,
    url: `https://meet.google.com/${code}`,
  };
}

/**
 * Opens a Google Meet session.
 * Tries native app deep link first via Linking, and falls back to WebBrowser.
 */
export async function openGoogleMeetSession(
  codeOrUrl: string,
): Promise<boolean> {
  const url = formatGoogleMeetUrl(codeOrUrl);
  if (!url) return false;

  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      return true;
    }
  } catch {
    // If canOpenURL threw or failed, proceed to try direct open or fallback
  }

  try {
    await Linking.openURL(url);
    return true;
  } catch {
    try {
      const result = await WebBrowser.openBrowserAsync(url);
      return result.type !== "cancel";
    } catch {
      return false;
    }
  }
}
