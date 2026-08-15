import { Feather, FontAwesome } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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
import { ensureUserProfile } from "../services/userProfile";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapAuthError(code: string | undefined) {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found with this email. Try signing up.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
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
      setPasswordError("Please enter your password.");
      hasError = true;
    } else {
      setPasswordError("");
    }

    return !hasError;
  }, [email, password]);

  const handleContinue = useCallback(async () => {
    if (isLoading) return;

    setGeneralError("");

    if (!validateFields()) return;

    try {
      setIsLoading(true);
      const credential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password,
      );
      await ensureUserProfile(credential.user);
      router.replace("/");
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as any).code
          : undefined;
      const message = mapAuthError(code);

      if (code === "auth/invalid-email") {
        setEmailError(message);
      } else if (code === "auth/wrong-password") {
        setPasswordError(message);
        setPassword("");
      } else if (code === "auth/user-not-found") {
        setEmailError(message);
      } else {
        setGeneralError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [email, password, isLoading, router, validateFields]);

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
    if (email.trim() && password) {
      handleContinue();
    } else {
      emailInputRef.current?.focus();
    }
  }, [email, password, handleContinue]);

  const toggleShowPassword = useCallback(() => {
    setShowPassword((c) => !c);
  }, []);

  const handleForgot = useCallback(() => {
    router.push({ pathname: "/forgot-password", params: { from } });
  }, [router, from]);

  const handleBack = useCallback(() => {
    if (from) {
      router.replace(`/${from}`);
    } else {
      router.back();
    }
  }, [router, from]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.replace("/");
    } catch {
      Alert.alert("Unable to sign out", "Please try again.");
    }
  }, [router]);

  const currentUser = auth.currentUser;

  if (currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
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

          <Text style={styles.subtitle}>
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
              onPress={handleLogout}
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
              <Text style={styles.title}>Log In</Text>
            </View>

            <Text style={styles.subtitle}>
              Fill your information or continue with your{"\n"}social accounts
            </Text>

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

              <Pressable
                onPress={handleForgot}
                style={styles.forgotRow}
                accessibilityRole="button"
                accessibilityLabel="Forgot password"
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>

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
                onPress={() => router.push("/signup")}
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
  passwordInput: { flex: 1, color: colors.dark, fontSize: 15 },
  visibilityButton: {
    padding: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  forgotRow: { alignItems: "flex-end" },
  forgotText: { color: "#444", fontSize: 12, textDecorationLine: "underline" },
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
