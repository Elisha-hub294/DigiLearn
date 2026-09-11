const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("default subject and add-item fallbacks no longer point at missing Firebase storage objects", () => {
  const pageTypesSource = fs.readFileSync(
    path.join(__dirname, "../../src/components/page/pageTypes.ts"),
    "utf8",
  );
  const addItemConstantsSource = fs.readFileSync(
    path.join(__dirname, "../../src/components/library/add-item/constants.ts"),
    "utf8",
  );
  const firebaseStorageSource = fs.readFileSync(
    path.join(__dirname, "../../src/utils/firebaseStorage.ts"),
    "utf8",
  );

  assert.ok(
    !pageTypesSource.includes('"icons/default-2d.png"'),
    "DEFAULT_SUBJECT_AVATAR must not fall back to a missing Firebase object.",
  );
  assert.ok(
    !addItemConstantsSource.includes('"icons/default-2d.png"'),
    "FALLBACK_ICON_URL must not fall back to a missing Firebase object.",
  );
  assert.ok(
    firebaseStorageSource.includes("STALE_FIREBASE_DEFAULT_ASSET_PATHS"),
    "Firebase storage resolution must explicitly block the stale missing default asset.",
  );
});
