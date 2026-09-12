const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const emailLinkAuthSource = fs.readFileSync(
  path.join(__dirname, "../../src/services/emailLinkAuth.ts"),
  "utf8",
);

test("email-link continue URL uses the native app deep link instead of a hosted web route", () => {
  assert.match(
    emailLinkAuthSource,
    /Linking\.createURL\(["']finishSignIn["']\)|return .*finishSignIn/i,
    "Expected the email link to redirect to a native deep link for the app.",
  );
  assert.doesNotMatch(
    emailLinkAuthSource,
    /digilearn-af86d\.web\.app\/finishSignIn/i,
    "Expected the continue URL to avoid the hosted web app path on native devices.",
  );
  assert.match(
    emailLinkAuthSource,
    /packageName:\s*["']com\.osplatform\.app["']/i,
    "Expected Android email links to target the installed app package.",
  );
});
