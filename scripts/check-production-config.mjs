import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const appJsonPath = path.join(root, "app.json");

function fail(message) {
  console.error(`Production config check failed: ${message}`);
  process.exit(1);
}

if (!fs.existsSync(appJsonPath)) {
  fail("app.json not found in project root");
}

const appJson = JSON.parse(fs.readFileSync(appJsonPath, "utf8"));
const expo = appJson.expo ?? {};
const publicKeys = [
  "firebaseApiKey",
  "firebaseAuthDomain",
  "firebaseProjectId",
  "firebaseStorageBucket",
  "firebaseMessagingSenderId",
  "firebaseAppId",
  "googleWebClientId",
];

for (const key of publicKeys) {
  if (expo.extra && Object.prototype.hasOwnProperty.call(expo.extra, key)) {
    fail(
      `Remove exposed secret '${key}' from expo.extra in app.json. Use EXPO_PUBLIC_* env vars instead.`,
    );
  }

  if (expo.web && expo.web.config && expo.web.config.firebase) {
    if (
      Object.prototype.hasOwnProperty.call(
        expo.web.config.firebase,
        key
          .replace(/^firebase/, "")
          .replace(/^[A-Z]/, (c) => c.toLowerCase()) || key,
      )
    ) {
      fail(
        `Remove exposed Firebase config from expo.web.config.firebase in app.json.`,
      );
    }
  }
}

const firebaseConfigBlock = {
  apiKey: "EXPO_PUBLIC_FIREBASE_API_KEY",
  authDomain: "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  projectId: "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  storageBucket: "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  messagingSenderId: "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  appId: "EXPO_PUBLIC_FIREBASE_APP_ID",
};

const missing = Object.entries(firebaseConfigBlock).filter(
  ([, envKey]) => !process.env[envKey],
);
if (missing.length) {
  fail(
    `Missing required environment variables: ${missing.map(([_, envKey]) => envKey).join(", ")}.`,
  );
}

console.log(
  "Production config check passed. No embedded Firebase keys were found in app.json.",
);
