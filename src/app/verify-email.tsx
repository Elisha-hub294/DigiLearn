import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { reload, signOut } from "firebase/auth";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../firebaseConfig";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";
import { sendEmailLink } from "../services/emailLinkAuth";
import {
  getUserOnboardingState,
  initializeUserProfile,
} from "../services/userProfile";

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    switch ((error as { code?: string }).code) {
      case "auth/too-many-requests":
        return "Too many emails have been requested. Please wait a little and try again.";
      case "auth/network-request-failed":
        return "Couldn't connect. Check your internet connection and try again.";
      case "auth/operation-not-allowed":
        return "Email-link sign-in is not enabled yet. Please enable it in Firebase Authentication and try again.";
      case "auth/unauthorized-continue-uri":
      case "auth/unauthorized-domain":
        return "Email-link sign-in is not configured for this app domain yet. Please contact support.";
      case "auth/invalid-continue-uri":
        return "Email-link sign-in is configured with an invalid return URL. Please contact support.";
    }
  }
  return "Something went wrong. Please try again.";
}

export default function VerifyEmailScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const { email: emailParam, next } = useLocalSearchParams<{
    email?: string;
    next?: string;
  }>();
  const { width } = useWindowDimensions();
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(520, width - horizontalPadding * 2);
  const email = emailParam || "your email address";

  const checkVerification = useCallback(async () => {
    if (isChecking) return;

    setErrorMessage("");
    setMessage("");
    setIsChecking(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        setErrorMessage(
          "Return to this web app in the same browser where you started sign-up, then try again.",
        );
        return;
      }

      await reload(user);
      if (!auth.currentUser?.emailVerified) {
        setMessage(
          "Your email is not confirmed yet. Open the verification link, then come back and try again.",
        );
        return;
      }

      await initializeUserProfile();
      const onboarding = await getUserOnboardingState(user.uid);
      router.dismissAll();
      router.replace(
        onboarding.accountTypeCompleted && onboarding.type
          ? ("/" as never)
          : ("/account-type" as never),
      );
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, router]);

  const resendVerification = useCallback(async () => {
    if (isSending || !emailParam) return;

    setErrorMessage("");
    setMessage("");
    setIsSending(true);
    try {
      await sendEmailLink(emailParam);
      setMessage(`A new verification link was sent to ${email}.`);
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsSending(false);
    }
  }, [email, isSending]);

  const handleSignOut = useCallback(async () => {
    await signOut(auth);
    router.replace("/welcome" as never);
  }, [router]);

  const handleModifyEmail = useCallback(() => {
    router.replace(next === "/account-type" ? "/signup" : "/login");
  }, [next, router]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.container, { maxWidth: contentMaxWidth }]}>
          <View style={styles.iconCircle}>
            <Feather name="mail" size={30} color={colors.primary} />
          </View>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a verification link to {email}. Verify your email before
            continuing to OS platform.
          </Text>
          <Text style={styles.infoMessage}>
            If you do not see the email, check your spam or junk folder and
            search for OS platform.
          </Text>

          {message ? (
            <Text style={styles.successMessage}>{message}</Text>
          ) : null}
          {errorMessage ? (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          ) : null}

          <Pressable
            onPress={checkVerification}
            disabled={isChecking || isSending}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Check email verification status"
          >
            {isChecking ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>I verified my email</Text>
            )}
          </Pressable>

          <Pressable
            onPress={resendVerification}
            disabled={isChecking || isSending}
            style={({ pressed }) => [
              styles.secondaryButton,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Resend verification email"
          >
            {isSending ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>Resend email</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleSignOut}
            accessibilityRole="button"
            accessibilityLabel="Sign out"
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </Pressable>

          <Pressable
            onPress={handleModifyEmail}
            accessibilityRole="button"
            accessibilityLabel="Modify email"
          >
            <Text style={styles.modifyEmailText}>Modify email</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  container: { width: "100%", alignSelf: "center", alignItems: "center" },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    color: colors.dark,
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: "#666666",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  infoMessage: {
    color: "#666666",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  primaryButton: {
    width: "100%",
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  secondaryButton: {
    width: "100%",
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "600",
  },
  successMessage: {
    color: "#16803C",
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  errorMessage: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  signOutText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.xl,
  },
  modifyEmailText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.md,
  },
  pressed: { opacity: 0.75 },
});
