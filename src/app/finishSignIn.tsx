import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, spacing } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";
import { completeEmailLink } from "../services/emailLinkAuth";
import {
  getUserOnboardingState,
  initializeUserProfile,
} from "../services/userProfile";

/**
 * Firebase email-link authentication opens this path with its action-code
 * parameters. This route completes sign-in, creates the Firestore profile
 * when needed, and continues the onboarding flow.
 */
export default function FinishSignInScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{
    link?: string;
    apiKey?: string;
    oobCode?: string;
    email?: string;
  }>();

  const [errorMessage, setErrorMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [isCompleting, setIsCompleting] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const hasAttempted = useRef(false);

  const navigateToApp = useCallback(async (uid: string) => {
    try {
      await initializeUserProfile();
      const onboarding = await getUserOnboardingState(uid);
      router.dismissAll();
      router.replace(
        onboarding.accountTypeCompleted && onboarding.type
          ? ("/" as never)
          : ("/account-type" as never),
      );
    } catch (err) {
      console.warn("Failed to complete onboarding transition", err);
      router.replace("/" as never);
    }
  }, [router]);

  const finishSignIn = useCallback(
    async (url: string, emailOverride?: string) => {
      setErrorMessage("");
      setIsCompleting(true);

      try {
        const user = await completeEmailLink(url, emailOverride);
        if (!user) throw new Error("EMAIL_LINK_INVALID");

        setIsComplete(true);
        setIsCompleting(false);

        await navigateToApp(user.uid);
      } catch (error) {
        console.warn("Unable to complete email sign-in link", error);
        const code = error instanceof Error ? error.message : "";
        if (code === "EMAIL_LINK_ADDRESS_MISSING") {
          setNeedsEmail(true);
          setIsCompleting(false);
          return;
        }

        setErrorMessage(
          "We could not finish signing you in. Request a new email link and try again.",
        );
        setIsCompleting(false);
      }
    },
    [navigateToApp],
  );

  useEffect(() => {
    let cancelled = false;

    const resolveUrl = async (): Promise<string | null> => {
      // 1. Check if the link was passed directly in search params
      if (params.link) {
        return decodeURIComponent(params.link);
      }

      // 2. Check if query parameters contain the action code
      if (params.apiKey && params.oobCode) {
        const authDomain =
          process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ||
          "digilearn-af86d.firebaseapp.com";
        const query = new URLSearchParams();
        for (const [key, val] of Object.entries(params)) {
          if (typeof val === "string" && val) query.set(key, val);
        }
        return `https://${authDomain}/finishSignIn?${query.toString()}`;
      }

      // 3. Fallback to initial deep link URL
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) return initialUrl;
      } catch {
        // Fall through
      }

      return null;
    };

    const run = async () => {
      if (hasAttempted.current) return;
      const url = await resolveUrl();
      if (cancelled) return;

      if (url) {
        hasAttempted.current = true;
        setLinkUrl(url);
        await finishSignIn(url, params.email);
      } else {
        setIsCompleting(false);
        setErrorMessage("This email link is invalid or incomplete.");
      }
    };

    void run();

    const subscription = Linking.addEventListener("url", ({ url }) => {
      if (url && !cancelled) {
        hasAttempted.current = true;
        setLinkUrl(url);
        void finishSignIn(url, params.email);
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [finishSignIn, params]);

  const submitEmail = useCallback(() => {
    if (!linkUrl || !email.trim() || isCompleting) return;
    setNeedsEmail(false);
    void finishSignIn(linkUrl, email);
  }, [email, finishSignIn, isCompleting, linkUrl]);

  const handleContinueManual = useCallback(() => {
    router.replace("/" as never);
  }, [router]);

  const handleBackToLogin = useCallback(() => {
    router.replace("/login" as never);
  }, [router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
      edges={["top", "bottom"]}
    >
      <View
        style={[styles.container, { backgroundColor: themeColors.background }]}
      >
        {isCompleting ? (
          <ActivityIndicator color={colors.primary} size="large" />
        ) : null}

        <Text style={[styles.title, { color: themeColors.text }]}>
          {isComplete
            ? "Email confirmed"
            : needsEmail || errorMessage
              ? "Confirm your email address"
              : "Signing you in"}
        </Text>

        <Text style={[styles.subtitle, { color: themeColors.subtitle }]}>
          {isComplete
            ? "Redirecting you to OS platform..."
            : needsEmail
              ? "Enter the email address used to request this link."
              : errorMessage || "Finishing your email verification..."}
        </Text>

        {isComplete ? (
          <Pressable
            onPress={handleContinueManual}
            style={({ pressed }) => [
              styles.continueButton,
              styles.buttonSpacing,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.continueButtonText}>Continue to app</Text>
          </Pressable>
        ) : null}

        {needsEmail ? (
          <View style={styles.emailForm}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              placeholder="you@example.com"
              placeholderTextColor={themeColors.subtitle}
              style={[
                styles.emailInput,
                { color: themeColors.text, borderColor: themeColors.border },
              ]}
            />
            <Pressable
              onPress={submitEmail}
              disabled={!email.trim() || isCompleting}
              style={({ pressed }) => [
                styles.continueButton,
                (!email.trim() || isCompleting) && styles.disabledButton,
                pressed && styles.pressed,
              ]}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
          </View>
        ) : null}

        {errorMessage && !needsEmail ? (
          <Pressable
            onPress={handleBackToLogin}
            style={({ pressed }) => [
              styles.continueButton,
              styles.buttonSpacing,
              pressed && styles.pressed,
            ]}
          >
            <Text style={styles.continueButtonText}>Back to Log In</Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginTop: spacing.lg,
  },
  subtitle: {
    fontSize: 14,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  buttonSpacing: {
    marginTop: spacing.xl,
    width: "100%",
    maxWidth: 360,
  },
  emailForm: {
    width: "100%",
    maxWidth: 360,
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  emailInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    fontSize: 15,
  },
  continueButton: {
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.8,
  },
});
