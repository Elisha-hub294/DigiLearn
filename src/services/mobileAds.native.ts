import Constants from "expo-constants";

const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === "storeClient";

let isInitialized = false;

/**
 * Initializes the Google Mobile Ads SDK on native platforms (Android & iOS).
 * Safe to call multiple times; only initializes once.
 */
export async function initializeMobileAds(): Promise<void> {
  if (isInitialized || isExpoGo) return;

  try {
    const { default: mobileAds } =
      await import("react-native-google-mobile-ads");
    const adapterStatuses = await mobileAds().initialize();
    isInitialized = true;
    if (__DEV__) {
      console.log("[MobileAds] SDK initialized successfully:", adapterStatuses);
    }
  } catch (error) {
    console.warn("[MobileAds] Initialization failed:", error);
  }
}
