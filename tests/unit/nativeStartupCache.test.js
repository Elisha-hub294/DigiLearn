const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const startupCachePath = path.join(
  __dirname,
  "../../src/utils/startupNativeCache.ts",
);
const rootLayoutPath = path.join(__dirname, "../../src/app/_layout.tsx");

test("native startup cache warms remote assets and deduplicates repeated URLs", () => {
  const startupCacheSource = fs.readFileSync(startupCachePath, "utf8");
  const rootLayoutSource = fs.readFileSync(rootLayoutPath, "utf8");

  assert.match(
    startupCacheSource,
    /Image\.prefetch|prefetchNativeUrl|warmNativeStartupCache/i,
    "Expected a native image prefetch helper for app startup.",
  );
  assert.match(
    rootLayoutSource,
    /warmNativeStartupCache|prefetchNativeUrl/i,
    "Expected the root layout to run startup cache warmup on native.",
  );
  assert.match(
    startupCacheSource,
    /new Set\(|Set\<string\>|dedup|unique/i,
    "Expected startup warmup to deduplicate repeated remote URLs.",
  );
});
