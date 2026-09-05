import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { sendPasswordResetEmail } from "firebase/auth";
import { useCallback, useMemo, useState } from "react";
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
import { useTheme } from "../contexts/ThemeContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function mapResetError(code: string | undefined) {
  switch (code) {
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found with this email.";
    case "auth/too-many-requests":
      return "Too many requests. Please try again later.";
    case "auth/network-request-failed":
      return "Couldn't connect. Check your internet and try again.";
    default:
      return "Unable to send reset email. Please try again.";
  }
}

export default function ForgotPasswordScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const { width } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [generalMessage, setGeneralMessage] = useState("");

  const horizontalPadding = useMemo(() => getHorizontalPadding(width), [width]);
  const contentMaxWidth = Math.min(520, width - horizontalPadding * 2);

  const validate = useCallback(() => {
    const trimmed = email.trim();
    if (!trimmed) {
      setEmailError("Please enter your email address.");
      return false;
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setEmailError("Please enter a valid email address.");
      return false;
    }
    setEmailError("");
    return true;
  }, [email]);

  const handleSend = useCallback(async () => {
    if (isLoading) return;
    setGeneralMessage("");
    if (!validate()) return;

    try {
      setIsLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setGeneralMessage(
        "Password reset email sent. Check your inbox for instructions to reset your password.",
      );
    } catch (error) {
      const code =
        typeof error === "object" && error !== null && "code" in error
          ? (error as any).code
          : undefined;
      setGeneralMessage(mapResetError(code));
    } finally {
      setIsLoading(false);
    }
  }, [email, isLoading, validate]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (typeof from === "string" && from.trim()) {
      router.replace(from as any);
    }
  }, [router, from]);

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
              <Text style={styles.title}>Forgot Password</Text>
            </View>

            <Text style={styles.subtitle}>
              Enter the email address associated with your DigiLearn account and
              we'll send you a password reset link.
            </Text>

            <View style={styles.form}>
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Email</Text>
                <TextInput
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

              {generalMessage ? (
                <Text style={styles.generalMessage}>{generalMessage}</Text>
              ) : null}

              <Pressable
                onPress={handleSend}
                disabled={isLoading}
                style={({ pressed }) => [
                  styles.continueButton,
                  isLoading && styles.continueButtonDisabled,
                  pressed && !isLoading && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Send password reset link"
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.continueButtonText}>Send Reset Link</Text>
                )}
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
  generalMessage: {
    color: "#111827",
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
});
