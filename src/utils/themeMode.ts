export type ThemeMode = "light" | "dark";

export function resolveInitialThemeMode(
  storedMode: string | null,
  systemMode?: string | null,
): ThemeMode {
  if (storedMode === "light" || storedMode === "dark") {
    return storedMode;
  }

  if (systemMode === "dark" || systemMode === "light") {
    return systemMode;
  }

  return "light";
}
