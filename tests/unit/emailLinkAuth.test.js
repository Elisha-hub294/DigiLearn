const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const emailLinkAuthSource = fs.readFileSync(
  path.join(__dirname, "../../src/services/emailLinkAuth.ts"),
  "utf8",
);

test("email-link continue URL uses an authorized https URL and avoids custom deep-link schemes", () => {
  assert.match(
    emailLinkAuthSource,
    /return .*finishSignIn/i,
    "Expected the email link to return a finishSignIn continue URL.",
  );
  assert.doesNotMatch(
    emailLinkAuthSource,
    /Linking\.createURL/i,
    "Expected the continue URL to avoid Linking.createURL which produces custom schemes rejected by Firebase.",
  );
  assert.doesNotMatch(
    emailLinkAuthSource,
    /digilearn-af86d\.web\.app\/finishSignIn/i,
    "Expected the continue URL to avoid the deprecated web.app path.",
  );
  assert.match(
    emailLinkAuthSource,
    /packageName:\s*["']com\.osplatform\.app["']/i,
    "Expected Android email links to target the installed app package.",
  );
});

test("browser email-link fallback hands the single-use link to the native app", () => {
  const finishSignInSource = fs.readFileSync(
    path.join(__dirname, "../../src/app/finishSignIn.tsx"),
    "utf8",
  );

  assert.match(
    finishSignInSource,
    /Platform\.OS === "web"[\s\S]*?setIsBrowserPending\(true\)/,
    "Expected the browser callback to stop before consuming the email link.",
  );
  assert.match(
    finishSignInSource,
    /digilearn:\/\/finishSignIn\?link=/,
    "Expected the browser callback to offer the original link to the native app.",
  );
});
