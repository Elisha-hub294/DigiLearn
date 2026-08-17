import { Feather, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { createUserWithEmailAndPassword } from "firebase/auth";
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
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import {
    parseAuthError,
    signInWithFacebook,
    signInWithGoogle,
} from "../services/socialAuth";
import { getUserOnboardingState } from "../services/userProfile";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapAuthError(code: string | undefined) {
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists. Try logging in instead.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Your password is too weak. Please choose a stronger password.";
    case "auth/network-request-failed":
      return "Couldn't connect. Please check your internet connection and try again.";
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
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { width } = useWindowDimensions();
  const emailInputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
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

    if (!password) {
      setPasswordError("Password must be at least 6 characters.");
      hasError = true;
    } else if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      hasError = true;
    } else {
      setPasswordError("");
    }

    return !hasError;
  }, [email, password]);

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
      const credential = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      router.replace("/account-type" as never);
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as any).code
          : undefined;
      const message = mapAuthError(code);

      if (code === "auth/invalid-email") {
        setEmailError(message);
      } else if (code === "auth/weak-password") {
        setPasswordError(message);
      } else {
        setGeneralError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, isLoading, router, validateFields]);

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

  const handleEmailIcon = useCallback(() => {
    if (email.trim() && password) {
      handleContinue();
    } else {
      emailInputRef.current?.focus();
    }
  }, [email, password, handleContinue]);

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

  const toggleShowPassword = useCallback(() => {
    setShowPassword((current) => !current);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
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
                Fill your information or register with your social accounts
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

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Password</Text>
                <View
                  style={[
                    styles.passwordRow,
                    passwordError ? styles.inputError : null,
                  ]}
                >
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    placeholder="Enter password"
                    placeholderTextColor="#9CA3AF"
                    style={styles.passwordInput}
                    autoCapitalize="none"
                    autoCorrect={false}
                    textContentType="password"
                    accessibilityLabel="Password"
                    accessibilityHint="Enter your password"
                  />
                  <Pressable
                    onPress={toggleShowPassword}
                    style={styles.visibilityButton}
                    accessibilityRole="button"
                    accessibilityLabel={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#666666"
                    />
                  </Pressable>
                </View>
                {passwordError ? (
                  <Text style={styles.fieldError}>{passwordError}</Text>
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
                accessibilityLabel="Continue with email and password"
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.continueButtonText}>Continue</Text>
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
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 44,
    backgroundColor: "#D7E4FA",
    borderColor: "#AABBD5",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  passwordInput: {
    flex: 1,
    color: colors.dark,
    fontSize: 15,
  },
  visibilityButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
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
