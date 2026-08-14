import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useWindowDimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomTabBar } from "../components/ui/BottomTabBar";
import { ProfileProvider } from "../contexts/ProfileContext";

export default function RootLayout() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ProfileProvider>
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarPosition: isDesktop ? "left" : "bottom",
            }}
            tabBar={(props: any) => <BottomTabBar {...props} />}
          >
            <Tabs.Screen name="index" options={{ title: "Home" }} />
            <Tabs.Screen name="library" options={{ title: "Library" }} />
            <Tabs.Screen name="videos" options={{ title: "Courses" }} />
            <Tabs.Screen name="profile" options={{ title: "Account" }} />
            <Tabs.Screen
              name="settings"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="notifications"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="activity"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="my-profile"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="preferences"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="help"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="about"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="welcome"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="signup"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="login"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="book-preview"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="page-preview"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="lesson-player"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="pdf-reader"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="search"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="pages"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="teacher-profile"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
            <Tabs.Screen
              name="subject-profile"
              options={{ href: null, tabBarStyle: { display: "none" } }}
            />
          </Tabs>
        </ProfileProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
