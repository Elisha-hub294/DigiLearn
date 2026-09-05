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
        <Stack screenOptions={{ headerShown: false }} />
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
