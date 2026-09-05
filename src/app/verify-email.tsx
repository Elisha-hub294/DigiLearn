import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { reload, sendEmailVerification, signOut } from "firebase/auth";
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

function getErrorMessage(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    switch ((error as { code?: string }).code) {
      case "auth/too-many-requests":
        return "Too many emails have been requested. Please wait a little and try again.";
      case "auth/network-request-failed":
        return "Couldn't connect. Check your internet connection and try again.";
    }
  }
  return "Something went wrong. Please try again.";
}

export default function VerifyEmailScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const { next } = useLocalSearchParams<{ next?: string }>();
  const { width } = useWindowDimensions();
  const [isChecking, setIsChecking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(520, width - horizontalPadding * 2);
  const email = auth.currentUser?.email ?? "your email address";

  const continueAfterVerification = useCallback(() => {
    const destination = next === "/account-type" ? "/account-type" : "/";
    router.replace(destination as never);
  }, [next, router]);

  const checkVerification = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || isChecking) return;

    setErrorMessage("");
    setMessage("");
    setIsChecking(true);
    try {
      await reload(user);
      if (auth.currentUser?.emailVerified) {
        continueAfterVerification();
      } else {
        setErrorMessage(
          "Your email is not verified yet. Open the link in your email and try again.",
        );
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error));
    } finally {
      setIsChecking(false);
    }
  }, [continueAfterVerification, isChecking]);

  useFocusEffect(
    useCallback(() => {
      if (auth.currentUser?.emailVerified) {
        continueAfterVerification();
      }
    }, [continueAfterVerification]),
  );

  const resendVerification = useCallback(async () => {
    const user = auth.currentUser;
    if (!user || isSending) return;

    setErrorMessage("");
    setMessage("");
    setIsSending(true);
    try {
      await sendEmailVerification(user);
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
            continuing to DigiLearn.
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
  pressed: { opacity: 0.75 },
});
