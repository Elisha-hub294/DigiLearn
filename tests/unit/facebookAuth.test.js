const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const socialAuthSource = fs.readFileSync(
  path.join(__dirname, "../../src/services/socialAuth.ts"),
  "utf8",
);

const appConfigSource = fs.readFileSync(
  path.join(__dirname, "../../app.config.js"),
  "utf8",
);

test("app.config.js configures clientToken for react-native-fbsdk-next", () => {
  assert.match(
    appConfigSource,
    /EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN/,
    "Expected app.config.js to read EXPO_PUBLIC_FACEBOOK_CLIENT_TOKEN",
  );
  assert.match(
    appConfigSource,
    /clientToken:\s*facebookClientToken/,
    "Expected react-native-fbsdk-next plugin configuration to receive clientToken",
  );
});

test("socialAuth checks EXPO_PUBLIC_FACEBOOK_APP_ID before native sign in", () => {
  assert.match(
    socialAuthSource,
    /EXPO_PUBLIC_FACEBOOK_APP_ID/,
    "Expected signInWithFacebook to verify EXPO_PUBLIC_FACEBOOK_APP_ID",
  );
  assert.match(
    socialAuthSource,
    /Settings\.setAppID\(appId\)/,
    "Expected signInWithFacebook to dynamically configure Settings.setAppID",
  );
  assert.match(
    socialAuthSource,
    /Settings\.setClientToken\(clientToken\)/,
    "Expected signInWithFacebook to dynamically configure Settings.setClientToken",
  );
});

test("parseAuthError handles Facebook and Firebase failure cases", () => {
  // Extract parseAuthError block between export function parseAuthError and export async function signInWithGoogle
  const startIdx = socialAuthSource.indexOf("export function parseAuthError");
  const endIdx = socialAuthSource.indexOf("export async function signInWithGoogle");
  assert.ok(startIdx !== -1 && endIdx !== -1, "Function boundaries must exist in socialAuth.ts");

  const rawFunction = socialAuthSource
    .slice(startIdx, endIdx)
    .replace(/\/\*\*[\s\S]*?\*\/\s*$/, "")
    .trim();

  const cleanFunctionSource = rawFunction
    .replace(/^export\s+/, "")
    .replace(/:\s*unknown/g, "")
    .replace(/:\s*string/g, "")
    .replace(/\(error\s+as\s+\{[^}]+\}\)/g, "error");

  const parseAuthError = new Function(`
    ${cleanFunctionSource}
    return parseAuthError;
  `)();

  // Test 1: auth/operation-not-allowed
  const opNotAllowed = parseAuthError({
    code: "auth/operation-not-allowed",
    message: "The given sign-in provider is disabled for this Firebase project.",
  });
  assert.match(
    opNotAllowed,
    /Facebook sign-in is not enabled in Firebase Console/i,
    "Should explain that Facebook provider needs to be enabled in Firebase Console",
  );

  // Test 2: Key hash mismatch
  const keyHashError = parseAuthError(
    new Error(
      "Invalid key hash. The key hash 4x... does not match any stored key hashes.",
    ),
  );
  assert.match(
    keyHashError,
    /key hash/i,
    "Should guide user to configure Android key hash in Meta for Developers",
  );

  // Test 3: Client token missing
  const clientTokenError = parseAuthError(
    new Error("Client token is missing in the application configuration."),
  );
  assert.match(
    clientTokenError,
    /client token/i,
    "Should guide user to configure client token",
  );

  // Test 4: App inactive / in development mode
  const inactiveAppError = parseAuthError(
    new Error(
      "Feature Unavailable: Facebook Login is currently unavailable for this app",
    ),
  );
  assert.match(
    inactiveAppError,
    /inactive or in development mode/i,
    "Should explain Meta app status / development mode requirements",
  );

  // Test 5: Meaningful descriptive error message is preserved instead of masked
  const customError = parseAuthError(
    new Error("Custom Facebook Graph API error details"),
  );
  assert.equal(
    customError,
    "Custom Facebook Graph API error details",
    "Should preserve informative error messages instead of masking as generic failure",
  );

  // Test 6: Fallback for generic empty error
  const genericError = parseAuthError({});
  assert.equal(
    genericError,
    "Authentication failed. Please try again.",
    "Should fall back to user friendly default when no details are present",
  );
});
