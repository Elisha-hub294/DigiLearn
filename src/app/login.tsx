import { Feather, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../firebaseConfig";
import { ActionDialog } from "../components/ui/ActionDialog";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";
import { sendEmailLink } from "../services/emailLinkAuth";
import {
  parseAuthError,
  signInWithFacebook,
  signInWithGoogle,
} from "../services/socialAuth";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 50;

function mapAuthError(code: string | undefined) {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found with this email. Try signing up.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/network-request-failed":
      return "Couldn't connect. Check your internet and try again.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact support.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Authentication was cancelled.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function LoginScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { width } = useWindowDimensions();
  const emailInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [generalError, setGeneralError] = useState("");

  const horizontalPadding = useMemo(() => getHorizontalPadding(width), [width]);
  const contentMaxWidth = Math.min(520, width - horizontalPadding * 2);

  const validateFields = useCallback(() => {
    const trimmedEmail = email.trim();
    let hasError = false;

    if (!trimmedEmail) {
      setEmailError("Please enter your email address.");
      hasError = true;
    } else if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
      setEmailError(`Email must be ${MAX_EMAIL_LENGTH} characters or fewer.`);
      hasError = true;
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      hasError = true;
    } else {
      setEmailError("");
    }

    return !hasError;
  }, [email]);

  const handleContinue = useCallback(async () => {
    if (isLoading) return;

    setGeneralError("");

    if (!validateFields()) return;

    try {
      setIsLoading(true);
      await sendEmailLink(email);
      router.replace({
        pathname: "/verify-email",
        params: { next: "/", email: email.trim() },
      });
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as any).code
          : undefined;
      const message = mapAuthError(code);

      if (code === "auth/invalid-email") {
        setEmailError(message);
      } else {
        setGeneralError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, isLoading, router, validateFields]);

  const handleGoogleSignIn = useCallback(async () => {
    if (isLoading) return;
    setGeneralError("");
    setIsLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.cancelled) {
        return;
      }
      if (result.success && result.user) {
        router.dismissAll();
        router.replace("/");
      } else if (result.error) {
        setGeneralError(result.error);
      }
    } catch (error) {
      setGeneralError(parseAuthError(error));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, router]);

  const handleFacebookSignIn = useCallback(async () => {
    if (isLoading) return;
    setGeneralError("");
    setIsLoading(true);

    try {
      const result = await signInWithFacebook();
      if (result.cancelled) {
        return;
      }
      if (result.success && result.user) {
        router.dismissAll();
        router.replace("/");
      } else if (result.error) {
        setGeneralError(result.error);
      }
    } catch (error) {
      setGeneralError(parseAuthError(error));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, router]);

  const handleEmailIcon = useCallback(() => {
    if (email.trim()) {
      handleContinue();
    } else {
      emailInputRef.current?.focus();
    }
  }, [email, handleContinue]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (typeof from === "string" && from.trim()) {
      router.replace(from as any);
    }
  }, [router, from]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch {
      setShowLogoutDialog(false);
    }
  }, [router]);

  const currentUser = auth.currentUser;

  if (currentUser) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: themeColors.background }]}
      >
        <ActionDialog
          visible={showLogoutDialog}
          title="Unable to sign out"
          message="Please try again."
          primaryText="OK"
          onPrimary={() => setShowLogoutDialog(false)}
          onClose={() => setShowLogoutDialog(false)}
        />
        <View
          style={[
            styles.container,
            { paddingHorizontal: horizontalPadding, maxWidth: contentMaxWidth },
          ]}
        >
          <View style={styles.headerWithBack}>
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Go back"
            >
              <Feather name="arrow-left" size={22} color="#111" />
            </Pressable>
            <Text style={styles.title}>You're already signed in</Text>
          </View>

          <Text style={[styles.subtitle, { color: themeColors.subtitle }]}>
            You're already signed in to DigiLearn. You can continue learning or
            log out to switch accounts.
          </Text>

          <View style={styles.form}>
            <Pressable
              onPress={() => router.replace("/")}
              style={styles.continueButton}
              accessibilityRole="button"
            >
              <Text style={styles.continueButtonText}>Go to DigiLearn</Text>
            </Pressable>

            <Pressable
              onPress={() => setShowLogoutDialog(true)}
              style={[
                styles.continueButton,
                {
                  backgroundColor: colors.white,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                },
              ]}
              accessibilityRole="button"
            >
              <Text style={[styles.continueButtonText, { color: colors.dark }]}>
                Log out
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardArea}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 60}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.container, { maxWidth: contentMaxWidth }]}>
            <View style={styles.headerWithBack}>
              <Pressable
                onPress={handleBack}
                style={styles.backButton}
                accessibilityRole="button"
                accessibilityLabel="Go back"
              >
                <Feather name="arrow-left" size={22} color="#111" />
              </Pressable>
              <Text style={[styles.title, { color: themeColors.dark }]}>
                Log In
              </Text>
            </View>

            <Text style={[styles.subtitle, { color: themeColors.subtitle }]}>
              Fill your information or continue with your{"\n"}social accounts
            </Text>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  ref={emailInputRef}
                  value={email}
                  onChangeText={setEmail}
                  maxLength={MAX_EMAIL_LENGTH}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="your@email.com"
                  placeholderTextColor={themeColors.subtitle}
                  style={[
                    styles.input,
                    {
                      backgroundColor: themeColors.white,
                      borderColor: themeColors.border,
                      color: themeColors.text,
                    },
                    emailError ? styles.inputError : null,
                  ]}
                  textContentType="emailAddress"
                  accessibilityLabel="Email"
                  accessibilityHint="Enter your email address"
                />
                {emailError ? (
                  <Text style={styles.fieldError}>{emailError}</Text>
                ) : null}
              </View>

              {generalError ? (
                <Text style={styles.generalError}>{generalError}</Text>
              ) : null}

              <Pressable
                onPress={handleContinue}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.continueButton,
                  isLoading && styles.continueButtonDisabled,
                  pressed && !isLoading && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Send email sign-in link"
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.continueButtonText}>
                    Send sign-in link
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR LOG IN WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                onPress={handleGoogleSignIn}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.socialPressed,
                ]}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Google"
              >
                <FontAwesome name="google" size={20} color="#EA4335" />
              </Pressable>

              <Pressable
                onPress={handleFacebookSignIn}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.socialPressed,
                ]}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Sign in with Facebook"
              >
                <FontAwesome name="facebook" size={20} color="#1877F2" />
              </Pressable>

              <Pressable
                onPress={handleEmailIcon}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.socialPressed,
                ]}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Continue with email"
              >
                <Feather name="mail" size={20} color="#111111" />
              </Pressable>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.footerText}>Don't have an account?</Text>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/signup",
                    params: {
                      from:
                        typeof from === "string" && from.trim() ? from : "/",
                    },
                  })
                }
                accessibilityRole="button"
                accessibilityLabel="Sign up for DigiLearn"
              >
                <Text style={styles.footerLink}>Sign up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.white },
  keyboardArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  container: { width: "100%", alignSelf: "center" },
  headerWithBack: {
    alignItems: "center",
    marginBottom: spacing.xl,
    position: "relative",
  },
  backButton: { position: "absolute", left: 0, top: -2, padding: 6 },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: colors.dark,
    textAlign: "center",
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 13,
    color: "#666666",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: spacing.lg,
  },
  form: { width: "100%", gap: spacing.md },
  fieldGroup: { width: "100%", gap: 6 },
  fieldLabel: { color: colors.dark, fontSize: 13, fontWeight: "600" },
  input: {
    width: "100%",
    height: 44,
    backgroundColor: "#D7E4FA",
    borderColor: "#AABBD5",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    color: colors.dark,
    fontSize: 15,
  },
  fieldError: { color: "#B91C1C", marginTop: 6 },
  generalError: {
    color: "#B91C1C",
    textAlign: "center",
    marginTop: spacing.sm,
  },
  inputError: { borderColor: "#FCA5A5" },
  continueButton: {
    width: "100%",
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  continueButtonDisabled: { opacity: 0.7 },
  continueButtonText: { color: colors.white, fontSize: 16, fontWeight: "600" },
  buttonPressed: { opacity: 0.9 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: {
    marginHorizontal: 12,
    color: "#9CA3AF",
    fontSize: 12,
    fontWeight: "600",
  },
  socialRow: { flexDirection: "row", justifyContent: "space-between", gap: 12 },
  socialButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    justifyContent: "center",
    alignItems: "center",
  },
  socialPressed: { opacity: 0.85 },
  footerRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    alignItems: "center",
  },
  footerText: { color: colors.dark },
  footerLink: { color: "#3F82F4", fontWeight: "600" },
});
