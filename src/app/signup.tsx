import { Feather, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
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

import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";
import { sendEmailLink } from "../services/emailLinkAuth";
import {
  parseAuthError,
  signInWithFacebook,
  signInWithGoogle,
} from "../services/socialAuth";
import {
  getUserOnboardingState,
  initializeUserProfile,
  saveGoogleProfilePicture,
} from "../services/userProfile";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapAuthError(code: string | undefined) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/network-request-failed":
      return "Couldn't connect. Please check your internet connection and try again.";
    case "auth/too-many-requests":
      return "Too many email links have been requested. Please wait a little and try again.";
    case "auth/operation-not-allowed":
      return "Email-link sign-in is not enabled yet. Please enable it in Firebase Authentication and try again.";
    case "auth/unauthorized-continue-uri":
    case "auth/unauthorized-domain":
      return "Email-link sign-in is not configured for this app domain yet. Please contact support.";
    case "auth/invalid-continue-uri":
      return "Email-link sign-in is configured with an invalid return URL. Please contact support.";
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Authentication was cancelled.";
    case "auth/account-exists-with-different-credential":
      return "An account with this email already exists. Try logging in instead.";
    default:
      return "Something went wrong. Please try again.";
  }
}

export default function SignUpScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { width } = useWindowDimensions();
  const emailInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      setEmailError("Please enter a valid email address.");
      hasError = true;
    } else {
      setEmailError("");
    }

    return !hasError;
  }, [email]);

  const handleContinue = useCallback(async () => {
    if (isLoading) {
      return;
    }

    setGeneralError("");

    if (!validateFields()) {
      return;
    }

    try {
      setIsLoading(true);
      await sendEmailLink(email);
      router.replace({
        pathname: "/verify-email",
        params: { next: "/account-type", email: email.trim() },
      });
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as any).code
          : undefined;
      const message = mapAuthError(code);

      if (code === "auth/invalid-email") {
        setEmailError(message);
      } else setGeneralError(message);
    } finally {
      setIsLoading(false);
    }
  }, [email, isLoading, router, validateFields]);

  const handleGoogleSignUp = useCallback(async () => {
    if (isLoading) return;
    setGeneralError("");
    setIsLoading(true);

    try {
      const result = await signInWithGoogle();
      if (result.cancelled) {
        return;
      }
      if (result.success && result.user) {
        await initializeUserProfile();
        await saveGoogleProfilePicture(result.user);
        const onboarding = await getUserOnboardingState(result.user.uid);
        if (onboarding.accountTypeCompleted && onboarding.type) {
          router.replace("/" as never);
        } else {
          router.replace("/account-type" as never);
        }
      } else if (result.error) {
        setGeneralError(result.error);
      }
    } catch (error) {
      setGeneralError(parseAuthError(error));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, router]);

  const handleFacebookSignUp = useCallback(async () => {
    if (isLoading) return;
    setGeneralError("");
    setIsLoading(true);

    try {
      const result = await signInWithFacebook();
      if (result.cancelled) {
        return;
      }
      if (result.success && result.user) {
        await initializeUserProfile();
        const onboarding = await getUserOnboardingState(result.user.uid);
        if (onboarding.accountTypeCompleted && onboarding.type) {
          router.replace("/" as never);
        } else {
          router.replace("/account-type" as never);
        }
      } else if (result.error) {
        setGeneralError(result.error);
      }
    } catch (error) {
      setGeneralError(parseAuthError(error));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, router]);

  const handleLoginNavigation = useCallback(() => {
    router.push({
      pathname: "/login",
      params: {
        from: typeof from === "string" && from.trim() ? from : "/",
      },
    });
  }, [from, router]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (typeof from === "string" && from.trim()) {
      router.replace(from as any);
    }
  }, [from, router]);

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
              <Text style={styles.title}>Sign up</Text>
              <Text style={styles.subtitle}>
                Enter your email and we will send you a secure sign-in link.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
                  ref={emailInputRef}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="your@email.com"
                  placeholderTextColor="#9CA3AF"
                  style={[styles.input, emailError ? styles.inputError : null]}
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
                accessibilityLabel="Send email verification link"
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.continueButtonText}>
                    Send verification link
                  </Text>
                )}
              </Pressable>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR SIGN UP WITH</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.socialRow}>
              <Pressable
                onPress={handleGoogleSignUp}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.socialPressed,
                ]}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Sign up with Google"
              >
                <FontAwesome name="google" size={20} color="#EA4335" />
              </Pressable>

              <Pressable
                onPress={handleFacebookSignUp}
                style={({ pressed }) => [
                  styles.socialButton,
                  pressed && styles.socialPressed,
                ]}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel="Sign up with Facebook"
              >
                <FontAwesome name="facebook" size={20} color="#1877F2" />
              </Pressable>

              <Pressable
                onPress={handleContinue}
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
              <Text style={styles.footerText}>Already have an account?</Text>
              <Pressable
                onPress={handleLoginNavigation}
                accessibilityRole="button"
                accessibilityLabel="Log in to DigiLearn"
              >
                <Text style={styles.footerLink}>Log in</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  keyboardArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  container: {
    width: "100%",
    alignSelf: "center",
  },
  headerWithBack: {
    alignItems: "center",
    marginBottom: spacing.xxl,
    position: "relative",
  },
  backButton: { position: "absolute", left: 0, top: -2, padding: 6 },
  title: {
    fontSize: 30,
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
  },
  form: {
    width: "100%",
    gap: spacing.md,
  },
  fieldGroup: {
    width: "100%",
    gap: 6,
  },
  fieldLabel: {
    color: colors.dark,
    fontSize: 13,
    fontWeight: "600",
  },
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
  continueButton: {
    width: "100%",
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3B82F6",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  continueButtonDisabled: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#D9D9D9",
  },
  dividerText: {
    color: "#666666",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
  },
  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  socialButton: {
    flex: 1,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#C8C8C8",
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  socialPressed: {
    opacity: 0.75,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
    gap: 4,
  },
  footerText: {
    color: colors.dark,
    fontSize: 13,
  },
  footerLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "600",
  },
  fieldError: {
    color: "#EF4444",
    fontSize: 12,
    marginTop: 4,
  },
  generalError: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  inputError: {
    borderColor: "#EF4444",
  },
  buttonPressed: {
    opacity: 0.8,
  },
});
