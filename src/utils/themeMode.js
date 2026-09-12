function resolveInitialThemeMode(storedMode, systemMode) {
  if (storedMode === "light" || storedMode === "dark") {
    return storedMode;
  }

  // Keep the app's first launch in light mode even when the device is set to dark
  // mode, while still respecting any previously saved user preference.
  return "light";
}

module.exports = {
  resolveInitialThemeMode,
};
