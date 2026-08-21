import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "../constants/theme";
import { setGuestMode } from "../services/guestService";

export default function WelcomeScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();

  const contentPadding = width >= 900 ? 40 : width >= 600 ? 30 : 20;
  const contentMaxWidth = Math.min(520, width - contentPadding * 2);
  const illustrationWidth = Math.min(300, width - contentPadding * 2, 320);
  const illustrationHeight = Math.min(320, height * 0.42);

  const handleSignUp = useCallback(() => {
    router.push({ pathname: "/signup", params: { from: "welcome" } });
  }, [router]);

  const handleLogin = useCallback(() => {
    router.push({ pathname: "/login", params: { from: "welcome" } });
  }, [router]);

  const handleGuest = useCallback(async () => {
    await setGuestMode(true);
    router.replace("/");
  }, [router]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.page, { paddingHorizontal: contentPadding }]}>
        <View style={[styles.content, { maxWidth: contentMaxWidth }]}>
          <View style={styles.topSection}>
            <Image
              source={require("@/assets/images/welcome.png")}
              style={[
                styles.illustration,
                { width: illustrationWidth, height: illustrationHeight },
              ]}
              contentFit="contain"
              accessible
              accessibilityRole="image"
              alt="Welcome to DigiLearn illustration"
            />
            <Text style={styles.brand} accessibilityRole="header">
              <Text style={styles.brandBlack}>Digi</Text>
              <Text style={styles.brandAccent}>Learn</Text>
            </Text>
          </View>

          <View style={styles.actions}>
            <Pressable
              onPress={handleSignUp}
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Sign up for DigiLearn"
            >
              <Text style={styles.primaryButtonText}>Sign up</Text>
            </Pressable>

            <Pressable
              onPress={handleLogin}
              style={({ pressed }) => [
                styles.secondaryButton,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Log in to DigiLearn"
            >
              <Text style={styles.secondaryButtonText}>Log in</Text>
            </Pressable>

            <Pressable
              onPress={handleGuest}
              style={({ pressed }) => [
                styles.guestAction,
                pressed && styles.buttonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Continue as guest"
            >
              <Text style={styles.guestText}>Continue as Guest</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  content: {
    width: "100%",
    paddingVertical: spacing.xl,
    justifyContent: "space-between",
  },
  topSection: {
    alignItems: "center",
    gap: spacing.lg,
  },
  illustration: {
    maxWidth: 360,
    maxHeight: 340,
  },
  brand: {
    fontSize: 34,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  brandBlack: {
    color: colors.dark,
  },
  brandAccent: {
    color: colors.primary,
  },
  actions: {
    width: "100%",
    alignItems: "center",
    gap: spacing.md,
  },
  primaryButton: {
    width: 220,
    height: 42,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButton: {
    width: 220,
    height: 42,
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.dark,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "600",
  },
  guestAction: {
    marginTop: spacing.lg,
    alignSelf: "flex-end",
    paddingVertical: spacing.xs,
  },
  guestText: {
    color: "#333333",
    fontSize: 13,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
