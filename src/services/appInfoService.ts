import Constants from "expo-constants";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../../firebaseConfig";

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

let cachedVersion: string | null = null;
let versionPromise: Promise<string> | null = null;

const getFallbackVersion = (): string =>
  Constants.expoConfig?.version ??
  Constants.nativeApplicationVersion ??
  "1.0.0";

export async function getAppVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion;
  }

  if (!versionPromise) {
    versionPromise = (async () => {
      try {
        const snapshot = await getDocs(collection(db, "app"));
        for (const docSnap of snapshot.docs) {
          const version = docSnap.data().version;
          if (isNonEmptyString(version)) {
            cachedVersion = version.trim();
            return cachedVersion;
          }
        }
      } catch {
        // Fall through to local version.
      }

      cachedVersion = getFallbackVersion();
      return cachedVersion;
    })();
  }

  return versionPromise;
}

export function formatAppVersion(version: string): string {
  return `digilearn@${version}`;
}
