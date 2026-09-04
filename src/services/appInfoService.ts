import Constants from "expo-constants";

export async function getAppVersion(): Promise<string> {
  return (
    Constants.expoConfig?.version ??
    Constants.nativeApplicationVersion ??
    "1.0.0"
  );
}

export function formatAppVersion(version: string): string {
  return `digilearn@${version}`;
}
