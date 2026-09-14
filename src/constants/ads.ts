import { TestIds } from "react-native-google-mobile-ads";

// Use Google Test ID in development to prevent account bans,
// and your real Ad Unit ID in production builds.
export const REWARDED_AD_UNIT_ID = __DEV__
    ? TestIds.REWARDED
    : "ca-app-pub-1873352588181862/6332740481"; // <-- Replace with your real Ad Unit ID (with /)
