import * as Linking from "expo-linking";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { colors, spacing } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";
import { completeEmailLink } from "../services/emailLinkAuth";

/**
 * Firebase email-link authentication opens this path with its action-code
 * parameters. This route completes sign-in, creates the Firestore profile
 * when needed, and continues the onboarding flow.
 */
export default function FinishSignInScreen() {
  const { colors: themeColors } = useTheme();
  const [errorMessage, setErrorMessage] = useState("");
  const [linkUrl, setLinkUrl] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [needsEmail, setNeedsEmail] = useState(false);
  const [isCompleting, setIsCompleting] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const finishSignIn = useCallback(
    async (url: string, emailOverride?: string) => {
      setErrorMessage("");
      setIsCompleting(true);

      try {
        const user = await completeEmailLink(url, emailOverride);
        if (!user) throw new Error("EMAIL_LINK_INVALID");

        // Keep this page as a confirmation handoff. The DigiLearn tab's
        // "I verified my email" action creates the profile and continues the
        // normal onboarding flow.
        setIsComplete(true);
        setIsCompleting(false);
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
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const getLink = async () => {
      const url = await Linking.getInitialURL();
      if (!url) throw new Error("EMAIL_LINK_MISSING");
      if (!cancelled) setLinkUrl(url);
      await finishSignIn(url);
    };

    void getLink().catch((error) => {
      console.warn("Unable to read email sign-in link", error);
      if (!cancelled) {
        setErrorMessage("This email link is invalid or incomplete.");
        setIsCompleting(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [finishSignIn]);

  const submitEmail = useCallback(() => {
    if (!linkUrl || !email.trim() || isCompleting) return;
    setNeedsEmail(false);
    void finishSignIn(linkUrl, email);
  }, [email, finishSignIn, isCompleting, linkUrl]);

  return (
    <View style={[styles.container, { backgroundColor: themeColors.background }]}>
      {isCompleting ? <ActivityIndicator color={colors.primary} size="large" /> : null}
      <Text style={[styles.title, { color: themeColors.text }]}>
        {isComplete
          ? "Email confirmed"
          : needsEmail || errorMessage
          ? "Confirm your email address"
          : "Signing you in"}
      </Text>
      <Text style={[styles.subtitle, { color: themeColors.subtitle }]}>
        {isComplete
          ? "Return to the DigiLearn web app, then select \"I verified my email\" to continue."
          : needsEmail
          ? "Enter the email address used to request this link."
          : errorMessage || "Finishing your email verification..."}
      </Text>
      {needsEmail ? (
        <View style={styles.emailForm}>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            placeholder="you@example.com"
            placeholderTextColor="#94A3B8"
            style={[styles.emailInput, { color: themeColors.text, borderColor: themeColors.border }]}
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
    </View>
  );
}

const styles = StyleSheet.create({
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
  emailForm: { width: "100%", maxWidth: 360, marginTop: spacing.lg, gap: spacing.md },
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
  continueButtonText: { color: colors.white, fontSize: 15, fontWeight: "600" },
  disabledButton: { opacity: 0.55 },
  pressed: { opacity: 0.8 },
});
