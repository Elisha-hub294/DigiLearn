import AsyncStorage from "@react-native-async-storage/async-storage";

const GUEST_MODE_KEY = "@digilearn_guest_mode";

/**
 * Saves or removes local guest mode state.
 */
export async function setGuestMode(enabled: boolean): Promise<void> {
  try {
    if (enabled) {
      await AsyncStorage.setItem(GUEST_MODE_KEY, "true");
    } else {
      await AsyncStorage.removeItem(GUEST_MODE_KEY);
    }
  } catch (error) {
    console.error("Error setting guest mode:", error);
  }
}

/**
 * Checks if the user has previously selected guest mode.
 */
export async function isGuestMode(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(GUEST_MODE_KEY);
    return value === "true";
  } catch (error) {
    console.error("Error reading guest mode:", error);
    return false;
  }
}

/**
 * Clears local guest mode state (e.g., when logging out or deleting account).
 */
export async function clearGuestMode(): Promise<void> {
  try {
    await AsyncStorage.removeItem(GUEST_MODE_KEY);
  } catch (error) {
    console.error("Error clearing guest mode:", error);
  }
}
