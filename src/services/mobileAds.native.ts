import mobileAds from "react-native-google-mobile-ads";

let isInitialized = false;

/**
 * Initializes the Google Mobile Ads SDK on native platforms (Android & iOS).
 * Safe to call multiple times; only initializes once.
 */
export async function initializeMobileAds(): Promise<void> {
  if (isInitialized) return;

  try {
    const adapterStatuses = await mobileAds().initialize();
    isInitialized = true;
    if (__DEV__) {
      console.log("[MobileAds] SDK initialized successfully:", adapterStatuses);
    }
  } catch (error) {
    console.warn("[MobileAds] Initialization failed:", error);
  }
}
