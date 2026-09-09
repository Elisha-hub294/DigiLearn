import { getSharedResourceRoute } from "../services/shareLinks";

/**
 * Firebase mobile email links arrive through the Hosting callback path. Map
 * that external path to the Expo Router route that completes sign-in.
 */
export function redirectSystemPath({ path }: { path: string }) {
  try {
    const url = new URL(path, "https://digilearn-af86d.firebaseapp.com");
    if (url.pathname === "/__/auth/links") {
      return `/finishSignIn${url.search}`;
    }

    const sharedResourceRoute = getSharedResourceRoute(url.toString());
    if (sharedResourceRoute) return sharedResourceRoute;
  } catch {
    // Leave malformed third-party links to Expo Router's normal handling.
  }

  return path;
}
