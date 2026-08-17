import {
  FacebookAuthProvider,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithPopup,
  UserCredential,
} from "firebase/auth";
import { NativeModules, Platform, TurboModuleRegistry } from "react-native";
import { auth } from "../../firebaseConfig";

export interface SocialAuthResult {
  success: boolean;
  user?: UserCredential["user"];
  error?: string;
  cancelled?: boolean;
}

/**
 * Safely checks if the native GoogleSignin TurboModule/NativeModule exists
 * to prevent Expo Go from crashing with Invariant Violation on module load.
 */
function isNativeGoogleSigninAvailable(): boolean {
  if (Platform.OS === "web") return false;
  try {
    if (NativeModules && NativeModules.RNGoogleSignin) {
      return true;
    }
    if (
      typeof TurboModuleRegistry !== "undefined" &&
      typeof TurboModuleRegistry.get === "function"
    ) {
      return Boolean(TurboModuleRegistry.get("RNGoogleSignin"));
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Dynamically loads and configures GoogleSignin only if the native binary is present.
 */
function getNativeGoogleSigninModule() {
  if (!isNativeGoogleSigninAvailable()) {
    return null;
  }
  try {
    const mod = require("@react-native-google-signin/google-signin");
    if (mod && mod.GoogleSignin && typeof mod.GoogleSignin.configure === "function") {
      mod.GoogleSignin.configure({
        scopes: ["profile", "email"],
      });
    }
    return mod;
  } catch {
    return null;
  }
}

export function parseAuthError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "code" in error) {
    const code = (error as { code: string }).code;
    switch (code) {
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
      case "ERR_REQUEST_CANCELED":
      case "dismiss":
        return "Authentication was cancelled.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with this email using a different sign-in method.";
      case "auth/network-request-failed":
        return "Couldn't connect. Please check your internet connection and try again.";
      case "auth/user-disabled":
        return "This account has been disabled. Please contact support.";
      case "auth/invalid-credential":
        return "Invalid credentials. Please try signing in again.";
      default:
        if ("message" in error && typeof error.message === "string") {
          return error.message;
        }
        return "Authentication failed. Please try again.";
    }
  }
  return "An unexpected error occurred during authentication.";
}

/**
 * Signs in or signs up a user using Google Authentication.
 * - On Web: uses Firebase signInWithPopup.
 * - On Native Development Build / Standalone APK: uses native Google Play Services.
 * - On Expo Go: cleanly informs the user that native Google Sign-in requires a dev build.
 */
export async function signInWithGoogle(): Promise<SocialAuthResult> {
  try {
    if (Platform.OS === "web") {
      const provider = new GoogleAuthProvider();
      provider.addScope("profile");
      provider.addScope("email");
      const credential = await signInWithPopup(auth, provider);
      return { success: true, user: credential.user };
    }

    // Native mobile flow
    const googleModule = getNativeGoogleSigninModule();

    if (!googleModule) {
      return {
        success: false,
        error:
          "Google Sign-In on mobile requires native Google Play Services (available in a Development Build or standalone APK). Please sign up or log in using your Email & Password in Expo Go.",
      };
    }

    const { GoogleSignin, statusCodes, isErrorWithCode, isSuccessResponse } = googleModule;

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();

    let idToken: string | undefined | null;
    if (typeof isSuccessResponse === "function" && isSuccessResponse(response)) {
      idToken = response.data?.idToken;
    } else if (response && response.data && response.data.idToken) {
      idToken = response.data.idToken;
    } else if (response && response.idToken) {
      idToken = response.idToken;
    }

    if (!idToken && typeof GoogleSignin.getTokens === "function") {
      const tokens = await GoogleSignin.getTokens();
      idToken = tokens?.idToken;
    }

    if (!idToken) {
      return {
        success: false,
        error: "Unable to retrieve Google identification token. Please try again.",
      };
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCredential = await signInWithCredential(auth, credential);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    const googleModule = getNativeGoogleSigninModule();
    if (googleModule && typeof googleModule.isErrorWithCode === "function" && googleModule.isErrorWithCode(error)) {
      const { statusCodes } = googleModule;
      switch (error.code) {
        case statusCodes.SIGN_IN_CANCELLED:
          return { success: false, cancelled: true };
        case statusCodes.IN_PROGRESS:
          return {
            success: false,
            error: "Google sign-in is already in progress.",
          };
        case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
          return {
            success: false,
            error: "Google Play Services is unavailable or outdated on this device.",
          };
        default:
          return {
            success: false,
            error: error.message || "Google sign-in failed. Please try again.",
          };
      }
    }

    const errorMsg = parseAuthError(error);
    if (
      errorMsg.includes("cancelled") ||
      error?.code === "auth/popup-closed-by-user" ||
      error?.code === "auth/cancelled-popup-request"
    ) {
      return { success: false, cancelled: true };
    }
    return { success: false, error: errorMsg };
  }
}

/**
 * Signs in or signs up a user using Facebook Authentication.
 */
export async function signInWithFacebook(): Promise<SocialAuthResult> {
  try {
    const provider = new FacebookAuthProvider();
    provider.addScope("email");
    provider.addScope("public_profile");
    const credential = await signInWithPopup(auth, provider);
    return { success: true, user: credential.user };
  } catch (error: any) {
    const errorMsg = parseAuthError(error);
    if (
      errorMsg.includes("cancelled") ||
      error?.code === "auth/popup-closed-by-user" ||
      error?.code === "auth/cancelled-popup-request"
    ) {
      return { success: false, cancelled: true };
    }
    return { success: false, error: errorMsg };
  }
}
