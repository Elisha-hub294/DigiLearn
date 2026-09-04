import Constants from "expo-constants";
import { collection, getDocs } from "firebase/firestore";

import { db } from "../../firebaseConfig";
import { readLocalCache, writeLocalCache } from "../utils/localCache";

const APP_VERSION_CACHE_KEY = "digilearn-app-version";
const APP_VERSION_CACHE_VERSION = 1;
const APP_VERSION_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

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
      const cached = await readLocalCache<string>(
        APP_VERSION_CACHE_KEY,
        APP_VERSION_CACHE_VERSION,
      );
      if (
        cached &&
        Date.now() - cached.savedAt < APP_VERSION_CACHE_MAX_AGE_MS
      ) {
        cachedVersion = cached.data;
        return cachedVersion;
      }

      try {
        const snapshot = await getDocs(collection(db, "app"));
        for (const docSnap of snapshot.docs) {
          const version = docSnap.data().version;
          if (isNonEmptyString(version)) {
            cachedVersion = version.trim();
            await writeLocalCache(
              APP_VERSION_CACHE_KEY,
              cachedVersion,
              APP_VERSION_CACHE_VERSION,
            );
            return cachedVersion;
          }
        }
      } catch {
        if (cached) {
          cachedVersion = cached.data;
          return cachedVersion;
        }
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
