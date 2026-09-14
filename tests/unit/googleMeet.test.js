const test = require("node:test");
const assert = require("node:assert/strict");

function extractGoogleMeetCode(input) {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  const urlMatch = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?meet\.google\.com\/([a-zA-Z0-9_-]+)/i,
  );
  if (urlMatch?.[1]) {
    const rawSegment = urlMatch[1].toLowerCase().replace(/[^a-z0-9]/g, "");
    if (rawSegment.length === 10 && /^[a-z]{10}$/.test(rawSegment)) {
      return `${rawSegment.slice(0, 3)}-${rawSegment.slice(3, 7)}-${rawSegment.slice(7, 10)}`;
    }
    const hyphenatedMatch = urlMatch[1]
      .toLowerCase()
      .match(/^([a-z]{3})-([a-z]{4})-([a-z]{3})$/);
    if (hyphenatedMatch) {
      return hyphenatedMatch[0];
    }
  }

  const codeWithHyphens = trimmed
    .toLowerCase()
    .match(/\b([a-z]{3})-([a-z]{4})-([a-z]{3})\b/);
  if (codeWithHyphens?.[0]) {
    return codeWithHyphens[0];
  }

  const standaloneMatch = trimmed
    .toLowerCase()
    .match(/\b([a-z]{10})\b/);
  if (standaloneMatch?.[1]) {
    const raw = standaloneMatch[1];
    return `${raw.slice(0, 3)}-${raw.slice(3, 7)}-${raw.slice(7, 10)}`;
  }

  return null;
}

function formatGoogleMeetUrl(codeOrUrl) {
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

test("extractGoogleMeetCode extracts code from hyphenated format", () => {
  assert.equal(extractGoogleMeetCode("abc-defg-hij"), "abc-defg-hij");
  assert.equal(extractGoogleMeetCode("ABC-DEFG-HIJ"), "abc-defg-hij");
});

test("extractGoogleMeetCode extracts code from unhyphenated 10-char string", () => {
  assert.equal(extractGoogleMeetCode("abcdefghij"), "abc-defg-hij");
  assert.equal(extractGoogleMeetCode("ABCDEFGHIJ"), "abc-defg-hij");
});

test("extractGoogleMeetCode extracts code from standard Google Meet URLs", () => {
  assert.equal(
    extractGoogleMeetCode("https://meet.google.com/abc-defg-hij"),
    "abc-defg-hij",
  );
  assert.equal(
    extractGoogleMeetCode("http://meet.google.com/abc-defg-hij"),
    "abc-defg-hij",
  );
  assert.equal(
    extractGoogleMeetCode("meet.google.com/abc-defg-hij"),
    "abc-defg-hij",
  );
  assert.equal(
    extractGoogleMeetCode("https://meet.google.com/abc-defg-hij?authuser=0&hs=122"),
    "abc-defg-hij",
  );
  assert.equal(
    extractGoogleMeetCode("https://meet.google.com/abcdefghij"),
    "abc-defg-hij",
  );
});

test("extractGoogleMeetCode extracts code from full invite text messages", () => {
  const inviteText =
    "To join the video meeting, click this link: https://meet.google.com/kmt-pqrs-uvw Otherwise, to join by phone, dial +1 123-456-7890 and enter this PIN: 123 456 789#";
  assert.equal(extractGoogleMeetCode(inviteText), "kmt-pqrs-uvw");

  const inviteText2 =
    "Join our live lesson now on Google Meet! Meeting code: xyz-abcd-efg";
  assert.equal(extractGoogleMeetCode(inviteText2), "xyz-abcd-efg");
});

test("extractGoogleMeetCode returns null for invalid or empty inputs", () => {
  assert.equal(extractGoogleMeetCode(""), null);
  assert.equal(extractGoogleMeetCode(null), null);
  assert.equal(extractGoogleMeetCode(undefined), null);
  assert.equal(extractGoogleMeetCode("hello world"), null);
  assert.equal(extractGoogleMeetCode("https://zoom.us/j/1234567890"), null);
});

test("formatGoogleMeetUrl returns canonical https://meet.google.com/xxx-yyyy-zzz URL", () => {
  assert.equal(
    formatGoogleMeetUrl("abc-defg-hij"),
    "https://meet.google.com/abc-defg-hij",
  );
  assert.equal(
    formatGoogleMeetUrl("abcdefghij"),
    "https://meet.google.com/abc-defg-hij",
  );
  assert.equal(
    formatGoogleMeetUrl("meet.google.com/abc-defg-hij"),
    "https://meet.google.com/abc-defg-hij",
  );
  assert.equal(
    formatGoogleMeetUrl("https://meet.google.com/abc-defg-hij?authuser=1"),
    "https://meet.google.com/abc-defg-hij",
  );
});
