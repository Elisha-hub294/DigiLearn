import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { colors, radius, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";

type TabRoute = {
  key: string;
  name: string;
};

const tabs = [
  { name: "Home", icon: "book-outline", activeIcon: "book", route: "index" },
  {
    name: "Library",
    icon: "archive-outline",
    activeIcon: "archive",
    route: "library",
  },
  {
    name: "Courses",
    icon: "play-circle-outline",
    activeIcon: "play-circle",
    route: "videos",
  },
  {
    name: "Account",
    icon: "account-outline",
    activeIcon: "account",
    route: "profile",
  },
] as const;

export const BottomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const isDesktop = width >= 768;
  const activeRoute = state.routes[state.index];
  const activeRouteParams = activeRoute?.params as
    | { openedFromAccount?: string }
    | undefined;
  const isTeacherAccountScreen =
    activeRoute?.name === "teacher-profile" &&
    activeRouteParams?.openedFromAccount === "true";

  const navigateToTab = (route: TabRoute) => {
    if (route.name === "profile" && profile?.type === "teacher") {
      navigation.navigate("teacher-profile", {
        name: profile.name,
        openedFromAccount: "true",
      });
      return;
    }

    navigation.navigate(route.name);
  };

  if (
    activeRoute?.name === "book-preview" ||
    activeRoute?.name === "page-preview" ||
    activeRoute?.name === "lesson-player" ||
    activeRoute?.name === "pdf-reader" ||
    activeRoute?.name === "search" ||
    activeRoute?.name === "(search)" ||
    activeRoute?.name === "pages" ||
    (activeRoute?.name === "teacher-profile" && !isTeacherAccountScreen) ||
    activeRoute?.name === "assistant" ||
    activeRoute?.name === "settings" ||
    activeRoute?.name === "preferences" ||
    activeRoute?.name === "my-profile" ||
    activeRoute?.name === "activity" ||
    activeRoute?.name === "help" ||
    activeRoute?.name === "about" ||
    activeRoute?.name === "notifications" ||
    activeRoute?.name === "teacher-applications" ||
    activeRoute?.name === "welcome" ||
    activeRoute?.name === "signup" ||
    activeRoute?.name === "login" ||
    activeRoute?.name === "account-type" ||
    activeRoute?.name === "account-quick-settings" ||
    activeRoute?.name === "forgot-password" ||
    activeRoute?.name === "loading"
  ) {
    return null;
  }

  if (isDesktop) {
    return (
      <View style={styles.desktopSidebar}>
        <View style={styles.brandingHeader}>
          <View style={styles.logoBadge}>
            <MaterialCommunityIcons
              name="school-outline"
              size={24}
              color={colors.primary}
            />
          </View>
          <Text style={styles.brandTitle}>DigiLearn</Text>
        </View>

        <View style={styles.desktopTabList}>
          {state.routes.map((route: TabRoute) => {
            const tab = tabs.find((t) => t.route === route.name);

            if (!tab) return null;

            const isActive =
              state.routes[state.index].key === route.key ||
              (route.name === "profile" && isTeacherAccountScreen);

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isActive && !event.defaultPrevented) {
                navigateToTab(route);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={({ pressed, hovered }: any) => [
                  styles.desktopItem,
                  isActive && styles.desktopItemActive,
                  (pressed || hovered) &&
                    !isActive &&
                    styles.desktopItemHovered,
                ]}
              >
                <MaterialCommunityIcons
                  name={(isActive ? tab.activeIcon : tab.icon) as any}
                  size={22}
                  color={isActive ? colors.primary : "#8A8A8A"}
                />
                <Text
                  style={[
                    styles.desktopLabel,
                    isActive && styles.desktopLabelActive,
                  ]}
                >
                  {tab.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {state.routes.map((route: TabRoute) => {
        const tab = tabs.find((t) => t.route === route.name);

        if (!tab) return null;

        const isActive =
          state.routes[state.index].key === route.key ||
          (route.name === "profile" && isTeacherAccountScreen);

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigateToTab(route);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.item}>
            <MaterialCommunityIcons
              name={(isActive ? tab.activeIcon : tab.icon) as any}
              size={20}
              color={isActive ? colors.primary : "#8A8A8A"}
            />
            <Text style={[styles.label, isActive && styles.labelActive]}>
              {tab.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  // Mobile Bottom Bar Styles
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 56,
  },
  label: {
    marginTop: 4,
    fontSize: 11,
    color: "#8A8A8A",
    fontWeight: "600",
  },
  labelActive: {
    color: colors.primary,
  },

  // Desktop Left Sidebar Styles
  desktopSidebar: {
    width: 220,
    height: "100%",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: "flex-start",
  },
  brandingHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xl,
    paddingTop: spacing.xs,
  },
  logoBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: "rgba(0, 110, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.text,
    letterSpacing: -0.5,
  },
  desktopTabList: {
    width: "100%",
    gap: 8,
  },
  desktopItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: "transparent",
  },
  desktopItemActive: {
    backgroundColor: "rgba(0, 110, 255, 0.1)",
  },
  desktopItemHovered: {
    backgroundColor: "rgba(0, 0, 0, 0.04)",
  },
  desktopLabel: {
    marginLeft: spacing.md,
    fontSize: 15,
    color: "#8A8A8A",
    fontWeight: "500",
  },
  desktopLabelActive: {
    color: colors.primary,
    fontWeight: "700",
  },
});
