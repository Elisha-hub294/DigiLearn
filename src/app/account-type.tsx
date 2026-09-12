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
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { auth } from "../../firebaseConfig";
import { Skeleton } from "../components/ui/Skeleton";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";
import {
  AccountType,
  getUserOnboardingState,
  saveAccountTypeDecision,
} from "../services/userProfile";
import {
  canChangeAccountType,
  getAccountTypeChangeError,
} from "../utils/accountTypeRules";

const ACCOUNT_OPTIONS: {
  type: AccountType;
  label: string;
  description: string;
  image: number;
  color: string;
}[] = [
  {
    type: "student",
    label: "Student Account",
    description: "Learn, save resources, track progress, and join discussions.",
    image: require("@/assets/images/learner.png"),
    color: "#72B8E5",
  },
  {
    type: "teacher",
    label: "Teacher Account",
    description:
      "Everything in Student, plus publish resources and share lessons after approval.",
    image: require("@/assets/images/tutor.png"),
    color: "#FF6269",
  },
];

function mapSaveError() {
  return "Couldn't save your account type. Please check your connection and try again.";
}

export default function AccountTypeScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const openedFromSettings = from === "settings";
  const { width } = useWindowDimensions();
  const { colors: themeColors } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [selectedAccountType, setSelectedAccountType] =
    useState<AccountType | null>(null);
  const [currentAccountType, setCurrentAccountType] = useState<AccountType>("");
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReviewPending, setIsReviewPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [carouselIndex, setCarouselIndex] = useState(0);

  const horizontalPadding = useMemo(() => getHorizontalPadding(width), [width]);
  const contentMaxWidth = Math.min(500, width - horizontalPadding * 2);
  const cardImageSize = useMemo(
    () => Math.min(340, Math.max(200, contentMaxWidth * 0.7)),
    [contentMaxWidth],
  );
  const cardMinHeight = useMemo(
    () => Math.min(500, Math.max(360, contentMaxWidth * 1.35)),
    [contentMaxWidth],
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        setIsCheckingAuth(false);
        return;
      }

      try {
        const onboarding = await getUserOnboardingState(nextUser.uid);
        setCurrentAccountType(onboarding.type ?? "");
        setIsReviewPending(onboarding.teacherApprovalStatus === "pending");
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

  const handleSelect = useCallback(
    (accountType: AccountType) => {
      if (isReviewPending) {
        return;
      }

      if (!canChangeAccountType(currentAccountType, accountType)) {
        setSelectedAccountType(null);
        setErrorMessage(getAccountTypeChangeError(currentAccountType));
        return;
      }

      setErrorMessage("");
      setSelectedAccountType(accountType);
    },
    [currentAccountType, isReviewPending],
  );

  const handleCarouselScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(
        event.nativeEvent.contentOffset.x / contentMaxWidth,
      );
      setCarouselIndex(
        Math.max(0, Math.min(index, ACCOUNT_OPTIONS.length - 1)),
      );
    },
    [contentMaxWidth],
  );

  const handleCardPress = useCallback(
    (accountType: AccountType, index: number) => {
      handleSelect(accountType);
      setCarouselIndex(index);
    },
    [handleSelect],
  );

  const handleSave = useCallback(async () => {
    if (!user || !selectedAccountType || isSubmitting || isReviewPending) {
      return;
    }

    if (!canChangeAccountType(currentAccountType, selectedAccountType)) {
      setErrorMessage(getAccountTypeChangeError(currentAccountType));
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
            "Your teacher application was sent to the OS platform team. We will notify you when a decision is made.",
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
        router.dismissAll();
        router.replace("/" as never);
      }
    } catch {
      setErrorMessage(mapSaveError());
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentAccountType,
    isReviewPending,
    isSubmitting,
    openedFromSettings,
    router,
    selectedAccountType,
    user,
  ]);

  const handleSkip = useCallback(async () => {
    if (!user || isSubmitting || isReviewPending) {
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      await saveAccountTypeDecision(user, "");
      router.dismissAll();
      router.replace("/" as never);
    } catch {
      setErrorMessage(mapSaveError());
    } finally {
      setIsSubmitting(false);
    }
  }, [isReviewPending, isSubmitting, router, user]);

  const handleLogin = useCallback(() => {
    router.replace("/login" as never);
  }, [router]);

  const handleSignup = useCallback(() => {
    router.replace("/signup" as never);
  }, [router]);

  if (isCheckingAuth) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: themeColors.background }]}
      >
        <View
          style={[
            styles.loadingWrap,
            { backgroundColor: themeColors.background },
          ]}
        >
          <Skeleton
            style={[
              styles.loadingSkeleton,
              { backgroundColor: themeColors.surface },
            ]}
          />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: themeColors.background }]}
      >
        <View
          style={[
            styles.page,
            {
              paddingHorizontal: horizontalPadding,
              backgroundColor: themeColors.background,
            },
          ]}
        >
          <View style={[styles.authState, { maxWidth: contentMaxWidth }]}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              You are not signed in
            </Text>
            <Text
              style={[styles.authSubtitle, { color: themeColors.subtitle }]}
            >
              Log in or create an account to set up your OS platform profile.
            </Text>

            <View style={styles.authActions}>
              <Pressable
                onPress={handleLogin}
                style={({ pressed }) => [
                  [
                    styles.primaryButton,
                    { backgroundColor: themeColors.primary },
                  ],
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
                  [
                    styles.secondaryButton,
                    {
                      backgroundColor: themeColors.surface,
                      borderColor: themeColors.border,
                    },
                  ],
                  pressed && styles.buttonPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Sign up"
              >
                <Text
                  style={[
                    styles.secondaryButtonText,
                    { color: themeColors.text },
                  ]}
                >
                  Sign up
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: horizontalPadding,
            backgroundColor: themeColors.background,
          },
        ]}
      >
        <View
          style={[styles.page, { backgroundColor: themeColors.background }]}
        >
          <View style={[styles.container, { maxWidth: contentMaxWidth }]}>
            <Text style={[styles.title, { color: themeColors.text }]}>
              {openedFromSettings ? "Choose your account type" : "Account type"}
            </Text>
            <Text style={[styles.subtitle, { color: themeColors.subtitle }]}>
              Choose the experience that fits how you use OS platform. Compare
              the features before deciding.
            </Text>

            {isReviewPending ? (
              <Text
                style={[styles.reviewNotice, { color: themeColors.warning }]}
              >
                Your teacher account is under review. Account type changes are
                unavailable until the application is decided.
              </Text>
            ) : null}

            <View style={styles.carouselWrap}>
              <FlatList
                data={ACCOUNT_OPTIONS}
                horizontal
                pagingEnabled
                bounces={false}
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item.type}
                onMomentumScrollEnd={handleCarouselScrollEnd}
                renderItem={({ item, index }) => (
                  <View
                    style={[styles.carouselItem, { width: contentMaxWidth }]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Select ${item.type} account, option ${index + 1} of ${ACCOUNT_OPTIONS.length}`}
                      accessibilityState={{
                        selected: selectedAccountType === item.type,
                        disabled: isReviewPending,
                      }}
                      disabled={isReviewPending}
                      onPress={() => handleCardPress(item.type, index)}
                      style={({ pressed }) => [
                        styles.card,
                        {
                          backgroundColor: item.color,
                          minHeight: cardMinHeight,
                        },
                        selectedAccountType === item.type &&
                          styles.cardSelected,
                        pressed && styles.cardPressed,
                      ]}
                    >
                      <Image
                        source={item.image}
                        style={[
                          styles.cardImage,
                          { width: cardImageSize, height: cardImageSize },
                        ]}
                        contentFit="contain"
                      />
                      <Text
                        style={[
                          styles.cardLabel,
                          item.type === "student" && styles.studentCardText,
                        ]}
                      >
                        {item.label}
                      </Text>
                      <Text
                        style={[
                          styles.cardDescription,
                          item.type === "student" &&
                            styles.studentCardDescription,
                        ]}
                      >
                        {item.description}
                      </Text>
                    </Pressable>
                  </View>
                )}
              />
              <View style={styles.carouselControls}>
                <Text
                  style={[
                    styles.carouselPosition,
                    { color: themeColors.subtitle },
                  ]}
                >
                  {carouselIndex + 1} of {ACCOUNT_OPTIONS.length}
                </Text>
                <View style={styles.dots}>
                  {ACCOUNT_OPTIONS.map((item, index) => (
                    <View
                      key={item.type}
                      style={[
                        styles.dot,
                        { backgroundColor: themeColors.border },
                        index === carouselIndex && {
                          backgroundColor: themeColors.primary,
                          width: 20,
                        },
                      ]}
                    />
                  ))}
                </View>
              </View>
            </View>

            {errorMessage ? (
              <Text style={[styles.errorText, { color: themeColors.danger }]}>
                {errorMessage}
              </Text>
            ) : null}

            <Pressable
              disabled={!selectedAccountType || isSubmitting || isReviewPending}
              accessibilityRole="button"
              accessibilityLabel="Confirm account type"
              onPress={handleSave}
              style={({ pressed }) => [
                [
                  styles.primaryButton,
                  { backgroundColor: themeColors.primary },
                ],
                styles.confirmButton,
                (!selectedAccountType || isSubmitting || isReviewPending) &&
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

            {!openedFromSettings ? (
              <View style={styles.skipRow}>
                <Pressable
                  onPress={handleSkip}
                  disabled={isSubmitting || isReviewPending}
                  style={({ pressed }) => [
                    styles.skipButton,
                    pressed && !isSubmitting && styles.skipButtonPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Skip account type selection"
                >
                  <Text
                    style={[styles.skipText, { color: themeColors.subtitle }]}
                  >
                    Skip →
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingVertical: spacing.xxl,
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
    fontWeight: "800",
    color: colors.dark,
    marginBottom: spacing.lg,
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.text,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: spacing.xl,
    maxWidth: "100%",
  },
  reviewNotice: {
    width: "100%",
    marginBottom: spacing.xl,
    color: colors.text,
    fontSize: 14.5,
    lineHeight: 22,
    textAlign: "center",
  },
  carouselWrap: {
    width: "100%",
    marginBottom: spacing.xl,
  },
  carouselItem: {
    paddingHorizontal: spacing.xs,
  },
  card: {
    minHeight: 280,
    borderRadius: 26,
    padding: spacing.lg,
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(15, 23, 42, 0.08)",
    boxShadow: "0px 6px 10px rgba(0, 0, 0, 0.08)",
    elevation: 3,
  },
  cardSelected: {
    borderColor: "rgba(15, 23, 42, 0.5)",
    boxShadow: "0px 0px 12px rgba(0, 0, 0, 0.12)",
    transform: [{ scale: 1.015 }],
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  carouselControls: {
    alignItems: "center",
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  carouselPosition: {
    fontSize: 12,
    fontWeight: "600",
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  cardImage: {
    width: 140,
    height: 140,
  },
  cardLabel: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  studentCardText: {
    color: "#103B62",
  },
  cardDescription: {
    color: colors.white,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  studentCardDescription: {
    color: "#1E4567",
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
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
    marginBottom: spacing.xl,
  },
  authActions: {
    width: "100%",
    gap: spacing.md,
  },
});
