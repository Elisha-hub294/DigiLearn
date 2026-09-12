import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Linking from "expo-linking";
import { Stack, usePathname, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";
import { NetworkStatusBanner } from "../components/ui/NetworkStatusBanner";
import {
  AccountDeletionProvider,
  useAccountDeletion,
} from "../contexts/AccountDeletionContext";
import { ProfileProvider } from "../contexts/ProfileContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";
import { completeEmailLink } from "../services/emailLinkAuth";
import { getSharedResourceRoute, PLAY_STORE_URL } from "../services/shareLinks";
import {
  getUserOnboardingState,
  initializeUserProfile,
} from "../services/userProfile";
import LoadingScreen from "./loading";

const ONBOARDING_KEY = "onboarding_complete";

void SplashScreen.preventAutoHideAsync();

const startupBackground = "#FFFFFF";

function AppShell() {
  const { isDark, isHydrated } = useTheme();
  const { isDeletingAccount } = useAccountDeletion();
  const [showStartupLoading, setShowStartupLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isHydrated) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    void (async () => {
      await SplashScreen.hideAsync();
      if (
        Platform.OS === "web" &&
        (pathname === "/" || pathname === "/terms-and-policies")
      ) {
        timer = setTimeout(() => {
          if (active) setShowStartupLoading(false);
        }, 1200);
        return;
      }

      const seen = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (active && !seen) {
        router.replace("/onboarding" as any);
      }
      timer = setTimeout(() => {
        if (active) setShowStartupLoading(false);
      }, 1200);
    })();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [isHydrated, pathname, router]);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    if (getSharedResourceRoute(window.location.href)) {
      window.location.replace(PLAY_STORE_URL);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const handleUrl = async (url: string) => {
      const sharedResourceRoute = getSharedResourceRoute(url);
      if (sharedResourceRoute) {
        router.replace(sharedResourceRoute as never);
        return;
      }

      // Expo Router opens this callback in finishSignIn.tsx, which owns the
      // sign-in and profile initialization flow.
      try {
        const path = new URL(url).pathname.toLowerCase();
        if (path === "/finishsignin" || path === "/__/auth/links") return;
      } catch {
        // Continue to the existing handler for non-standard deep-link URLs.
      }

      try {
        const user = await completeEmailLink(url);
        if (!user || !active) return;

        await initializeUserProfile();
        const onboarding = await getUserOnboardingState(user.uid);
        if (active) {
          router.replace(
            onboarding.accountTypeCompleted ? "/" : "/account-type",
          );
        }
      } catch (error) {
        console.warn("Unable to complete email sign-in link", error);
      }
    };

    const subscription = Linking.addEventListener("url", ({ url }) => {
      void handleUrl(url);
    });
    void Linking.getInitialURL().then((url) => {
      if (url) void handleUrl(url);
    });

    return () => {
      active = false;
      subscription.remove();
    };
  }, [router]);

  return (
    <ErrorBoundary>
      <StatusBar style={isDark ? "light" : "dark"} />
      <ProfileProvider>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="(search)" />
          <Stack.Screen name="about" />
          <Stack.Screen name="account-quick-settings" />
          <Stack.Screen name="account-type" />
          <Stack.Screen name="activity" />
          <Stack.Screen name="add-banner" />
          <Stack.Screen name="add-book" />
          <Stack.Screen name="add-page" />
          <Stack.Screen name="add-paper" />
          <Stack.Screen name="add-trending-lesson" />
          <Stack.Screen name="admin-activity" />
          <Stack.Screen name="admin-reports" />
          <Stack.Screen name="assistant" />
          <Stack.Screen name="book-preview" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="finishSignIn" />
          <Stack.Screen name="help" />
          <Stack.Screen name="hidden-items" />
          <Stack.Screen name="lesson-player" />
          <Stack.Screen name="loading" />
          <Stack.Screen name="login" />
          <Stack.Screen name="my-profile" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="page-preview" />
          <Stack.Screen name="pages" />
          <Stack.Screen name="paper-preview" />
          <Stack.Screen name="paper-revision-dashboard" />
          <Stack.Screen name="pdf-reader" />
          <Stack.Screen name="preferences" />
          <Stack.Screen name="publish" />
          <Stack.Screen name="see-all" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="signup" />
          <Stack.Screen name="teacher-account-quick-settings" />
          <Stack.Screen name="teacher-application-review" />
          <Stack.Screen name="teacher-applications" />
          <Stack.Screen name="teacher-profile" />
          <Stack.Screen name="terms-and-policies" />
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="onboarding" options={{ animation: "fade" }} />
          <Stack.Screen name="welcome" />
        </Stack>
      </ProfileProvider>
      <NetworkStatusBanner />
      {isDeletingAccount ? (
        <View
          style={[styles.deletionBarrier, { pointerEvents: "auto" }]}
          onStartShouldSetResponder={() => true}
        >
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.deletionText}>Deleting your account...</Text>
          <Text style={styles.deletionSubtext}>
            Please keep the app open until deletion is complete.
          </Text>
        </View>
      ) : null}
      {showStartupLoading ? (
        <View
          style={[
            styles.startupLoading,
            { pointerEvents: "auto", backgroundColor: startupBackground },
          ]}
        >
          <LoadingScreen autoRedirect={false} />
        </View>
      ) : null}
    </ErrorBoundary>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AccountDeletionProvider>
            <AppShell />
          </AccountDeletionProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  deletionBarrier: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 9, 29, 0.92)",
    padding: 32,
  },
  startupLoading: {
    ...StyleSheet.absoluteFill,
    zIndex: 10,
  },
  deletionText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 18,
    textAlign: "center",
  },
  deletionSubtext: {
    color: "#DDEBFF",
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },
});
