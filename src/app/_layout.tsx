import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BottomTabBar } from "../components/ui/BottomTabBar";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarStyle: { display: "none" },
          }}
          tabBar={(props: any) => <BottomTabBar {...props} />}
        >
          <Tabs.Screen name="index" options={{ title: "Home" }} />
          <Tabs.Screen name="library" options={{ title: "Library" }} />
          <Tabs.Screen name="videos" options={{ title: "Courses" }} />
          <Tabs.Screen name="profile" options={{ title: "Account" }} />
          <Tabs.Screen name="settings" options={{ title: "Settings" }} />
        </Tabs>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
