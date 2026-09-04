import { Image } from "expo-image";
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { auth } from "../../firebaseConfig";
import { Skeleton } from "../components/ui/Skeleton";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import {
  AccountType,
  getUserOnboardingState,
  saveAccountTypeDecision,
} from "../services/userProfile";

function mapSaveError() {
  return "Couldn't save your account type. Please check your connection and try again.";
}

export default function AccountTypeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const openedFromSettings = from === "settings";
  const { width } = useWindowDimensions();

  const [user, setUser] = useState<User | null>(null);
  const [selectedAccountType, setSelectedAccountType] =
    useState<AccountType | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const horizontalPadding = useMemo(() => getHorizontalPadding(width), [width]);
  const contentMaxWidth = Math.min(500, width - horizontalPadding * 2);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const onboarding = await getUserOnboardingState(nextUser.uid);
        if (onboarding.accountTypeCompleted && !openedFromSettings) {
          router.replace("/" as never);
        }
      } catch {
        // Keep the current onboarding step visible if the document is unavailable.
      } finally {
        setIsCheckingAuth(false);
      }
    });

    return () => unsubscribe();
  }, [openedFromSettings, router]);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (openedFromSettings) {
          router.back();
        }
        return true;
      };
      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      const unsubscribe = navigation.addListener("beforeRemove", (event) => {
        const actionType = event.data.action.type;
        if (
          openedFromSettings &&
          (actionType === "GO_BACK" || actionType === "POP")
        ) {
          event.preventDefault();
          router.back();
        }
      });

      return () => {
        subscription.remove();
        unsubscribe();
      };
    }, [navigation, openedFromSettings, router]),
  );

  const handleSelect = useCallback((accountType: AccountType) => {
    setErrorMessage("");
    setSelectedAccountType(accountType);
  }, []);

  const handleSave = useCallback(async () => {
    if (!user || !selectedAccountType || isSubmitting) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await saveAccountTypeDecision(user, selectedAccountType);
      if (openedFromSettings) {
        if (selectedAccountType === "teacher") {
          Alert.alert(
            "Application under review",
            "Your teacher application was sent to the DigiLearn team. We will notify you when a decision is made.",
            [
              {
                text: "Continue",
                onPress: () =>
                  router.replace("/teacher-account-quick-settings" as never),
              },
            ],
          );
        } else {
          router.back();
        }
      } else if (selectedAccountType === "student") {
        router.replace("/account-quick-settings" as never);
      } else if (selectedAccountType === "teacher") {
        router.replace("/teacher-account-quick-settings" as never);
      } else {
        router.replace("/" as never);
      }
    } catch {
      setErrorMessage(mapSaveError());
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, openedFromSettings, router, selectedAccountType, user]);

  const handleSkip = useCallback(async () => {
    if (!user || isSubmitting) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await saveAccountTypeDecision(user, "");
      router.replace("/" as never);
    } catch {
      setErrorMessage(mapSaveError());
    } finally {
      setIsSubmitting(false);
    }
  }, [isSubmitting, router, user]);

  const handleLogin = useCallback(() => {
    router.replace("/login" as never);
  }, [router]);

  const handleSignup = useCallback(() => {
    router.replace("/signup" as never);
  }, [router]);

  if (isCheckingAuth) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingWrap}>
          <Skeleton style={styles.loadingSkeleton} />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.page, { paddingHorizontal: horizontalPadding }]}>
          <View style={[styles.authState, { maxWidth: contentMaxWidth }]}>
            <Text style={styles.title}>You are not signed in</Text>
            <Text style={styles.authSubtitle}>
              Log in or create an account to set up your DigiLearn profile.
            </Text>

            <View style={styles.authActions}>
              <Pressable
                onPress={handleLogin}
                style={({ pressed }) => [
                  styles.primaryButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Log in"
              >
                <Text style={styles.primaryButtonText}>Log in</Text>
              </Pressable>

              <Pressable
                onPress={handleSignup}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign up"
              >
                <Text style={styles.secondaryButtonText}>Sign up</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.page, { paddingHorizontal: horizontalPadding }]}>
        <View style={[styles.container, { maxWidth: contentMaxWidth }]}>
          <Text style={styles.title}>
            {openedFromSettings ? "Choose your account type" : "Account type"}
          </Text>
          <Text style={styles.subtitle}>
            Choose the experience that fits how you use DigiLearn. Compare the
            features before deciding.
          </Text>

          <View style={styles.cardRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select student account"
              accessibilityState={{
                selected: selectedAccountType === "student",
              }}
              onPress={() => handleSelect("student")}
              style={({ pressed }) => [
                styles.card,
                styles.studentCard,
                selectedAccountType === "student" && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <Image
                source={require("@/assets/images/learner.png")}
                style={styles.cardImage}
                contentFit="contain"
              />
              <Text style={styles.cardLabel}>Student Account</Text>
              <Text style={styles.cardDescription}>
                Learn, save resources, track progress, and join discussions.
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Select teacher account"
              accessibilityState={{
                selected: selectedAccountType === "teacher",
              }}
              onPress={() => handleSelect("teacher")}
              style={({ pressed }) => [
                styles.card,
                styles.teacherCard,
                selectedAccountType === "teacher" && styles.cardSelected,
                pressed && styles.cardPressed,
              ]}
            >
              <Image
                source={require("@/assets/images/tutor.png")}
                style={styles.cardImage}
                contentFit="contain"
              />
              <Text style={styles.cardLabel}>Teacher Account</Text>
              <Text style={styles.cardDescription}>
                Everything in Student, plus publish resources and share lessons
                after approval.
              </Text>
            </Pressable>
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <Pressable
            disabled={!selectedAccountType || isSubmitting}
            accessibilityRole="button"
            accessibilityLabel="Confirm account type"
            onPress={handleSave}
            style={({ pressed }) => [
              styles.primaryButton,
              styles.confirmButton,
              (!selectedAccountType || isSubmitting) &&
                styles.primaryButtonDisabled,
              pressed && !isSubmitting && styles.buttonPressed,
            ]}
          >
            {isSubmitting ? (
              <ActivityIndicator color={colors.white} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>Confirm</Text>
            )}
          </Pressable>

          <View style={styles.skipRow}>
            <Pressable
              onPress={handleSkip}
              disabled={isSubmitting}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && !isSubmitting && styles.skipButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Skip account type selection"
            >
              <Text style={styles.skipText}>Skip →</Text>
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  loadingWrap: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingSkeleton: { width: 88, height: 88, borderRadius: 44 },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.dark,
    marginBottom: spacing.xl,
    textAlign: "center",
  },
  subtitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  cardRow: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "stretch",
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  card: {
    flex: 1,
    minHeight: 260,
    maxWidth: 200,
    borderRadius: 26,
    padding: spacing.lg,
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(15, 23, 42, 0.08)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  cardSelected: {
    borderColor: "rgba(15, 23, 42, 0.5)",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    transform: [{ scale: 1.015 }],
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  studentCard: {
    backgroundColor: "#72B8E5",
  },
  teacherCard: {
    backgroundColor: "#FF6269",
  },
  cardImage: {
    width: 140,
    height: 140,
  },
  cardLabel: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  cardDescription: {
    color: colors.white,
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  primaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.dark,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
  },
  secondaryButton: {
    width: "100%",
    height: 52,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.dark,
    justifyContent: "center",
    alignItems: "center",
  },
  secondaryButtonText: {
    color: colors.dark,
    fontSize: 16,
    fontWeight: "700",
  },
  buttonPressed: {
    opacity: 0.9,
  },
  confirmButton: {
    marginTop: spacing.xs,
  },
  skipRow: {
    width: "100%",
    alignItems: "flex-end",
    marginTop: spacing.lg,
  },
  skipButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  skipButtonPressed: {
    opacity: 0.6,
  },
  skipText: {
    color: "#2F2F2F",
    fontSize: 14,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  errorText: {
    width: "100%",
    marginBottom: spacing.md,
    color: "#B42318",
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  authState: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xxl,
  },
  authSubtitle: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  authActions: {
    width: "100%",
    gap: spacing.md,
  },
});
