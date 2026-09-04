import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ProfileProvider } from "../contexts/ProfileContext";
import { ThemeProvider, useTheme } from "../contexts/ThemeContext";

function AppShell() {
  const { colors, isDark, isHydrated } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {isHydrated ? (
        <ProfileProvider>
          <Stack screenOptions={{ headerShown: false }} />
        </ProfileProvider>
      ) : (
        <View style={{ flex: 1, backgroundColor: colors.background }} />
      )}
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
