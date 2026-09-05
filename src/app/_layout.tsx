import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NetworkStatusBanner } from "../components/ui/NetworkStatusBanner";
import { ProfileProvider } from "../contexts/ProfileContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

void SplashScreen.preventAutoHideAsync();

function AppShell() {
  const { isDark, isHydrated } = useTheme();

  useEffect(() => {
    if (isHydrated) void SplashScreen.hideAsync();
  }, [isHydrated]);

  return (
    <>
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
          <Stack.Screen name="verify-email" />
          <Stack.Screen name="welcome" />
        </Stack>
      </ProfileProvider>
      <NetworkStatusBanner />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
