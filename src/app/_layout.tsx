import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
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
          }}
          tabBar={(props: any) => <BottomTabBar {...props} />}
        >
          <Tabs.Screen name="index" options={{ title: "Home" }} />
          <Tabs.Screen name="library" options={{ title: "Library" }} />
          <Tabs.Screen name="videos" options={{ title: "Courses" }} />
          <Tabs.Screen name="profile" options={{ title: "Account" }} />
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
        </Tabs>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
