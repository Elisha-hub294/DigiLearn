const test = require("node:test");
const assert = require("node:assert/strict");

function extractYoutubeId(url) {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // 1. Watch URL: youtube.com/watch?v=VIDEO_ID
  const watchMatch = trimmed.match(/[?&]v=([^&#]+)/);
  if (watchMatch?.[1]) return watchMatch[1];

  // 2. Short URL: youtu.be/VIDEO_ID
  const shortMatch = trimmed.match(/youtu\.be\/([^?#&]+)/);
  if (shortMatch?.[1]) return shortMatch[1];

  // 3. Embed URL: youtube.com/embed/VIDEO_ID
  const embedMatch = trimmed.match(/youtube\.com\/embed\/([^?#&]+)/);
  if (embedMatch?.[1]) return embedMatch[1];

  // 4. Shorts URL: youtube.com/shorts/VIDEO_ID
  const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([^?#&]+)/);
  if (shortsMatch?.[1]) return shortsMatch[1];

  // 5. Direct v/ URL: youtube.com/v/VIDEO_ID
  const directMatch = trimmed.match(/youtube\.com\/v\/([^?#&]+)/);
  if (directMatch?.[1]) return directMatch[1];

  return null;
}

function getYoutubeEmbedUrl(rawUrl, startSeconds) {
  if (!rawUrl) return "";
  const id = extractYoutubeId(rawUrl);
  if (!id) return rawUrl.trim();

  const base = `https://www.youtube.com/embed/${id}`;
  if (startSeconds && startSeconds > 0) {
    return `${base}?start=${Math.floor(startSeconds)}`;
  }
  return base;
}

test("extractYoutubeId extracts ID correctly from various URL formats", () => {
  assert.equal(
    extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(
    extractYoutubeId("https://youtu.be/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(
    extractYoutubeId("https://www.youtube.com/embed/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(
    extractYoutubeId("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    "dQw4w9WgXcQ",
  );
  assert.equal(
    extractYoutubeId("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120s"),
    "dQw4w9WgXcQ",
  );
});

test("extractYoutubeId returns null for empty or invalid input", () => {
  assert.equal(extractYoutubeId(""), null);
  assert.equal(extractYoutubeId(null), null);
  assert.equal(extractYoutubeId(undefined), null);
  assert.equal(extractYoutubeId("https://vimeo.com/12345"), null);
});

test("getYoutubeEmbedUrl supports optional start timestamps", () => {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  assert.equal(
    getYoutubeEmbedUrl(url),
    "https://www.youtube.com/embed/dQw4w9WgXcQ",
  );
  assert.equal(
    getYoutubeEmbedUrl(url, 95),
    "https://www.youtube.com/embed/dQw4w9WgXcQ?start=95",
  );
});
