import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BottomTabBarProps } from "expo-router/js-tabs";
import {
    Pressable,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { radius, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";

type TabRoute = { key: string; name: string };
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
  const { colors } = useTheme();
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
  const hiddenRoutes = [
    "book-preview",
    "page-preview",
    "lesson-player",
    "pdf-reader",
    "search",
    "(search)",
    "pages",
    "assistant",
    "settings",
    "preferences",
    "my-profile",
    "activity",
    "help",
    "about",
    "notifications",
    "teacher-applications",
    "teacher-application-review",
    "welcome",
    "signup",
    "login",
    "account-type",
    "account-quick-settings",
    "forgot-password",
    "loading",
  ];
  if (
    hiddenRoutes.includes(activeRoute?.name ?? "") ||
    (activeRoute?.name === "teacher-profile" && !isTeacherAccountScreen)
  )
    return null;

  const renderTab = (route: TabRoute, desktop: boolean) => {
    const tab = tabs.find((item) => item.route === route.name);
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
      if (!isActive && !event.defaultPrevented) navigateToTab(route);
    };
    return (
      <Pressable
        key={route.key}
        onPress={onPress}
        style={({ pressed, hovered }: any) => [
          desktop ? styles.desktopItem : styles.item,
          desktop && {
            backgroundColor: isActive
              ? colors.primaryLight
              : pressed || hovered
                ? colors.lightBackground
                : "transparent",
          },
        ]}
      >
        <MaterialCommunityIcons
          name={(isActive ? tab.activeIcon : tab.icon) as any}
          size={desktop ? 22 : 20}
          color={isActive ? colors.primary : colors.inactive}
        />
        <Text
          style={[
            desktop ? styles.desktopLabel : styles.label,
            { color: isActive ? colors.primary : colors.inactive },
            isActive && styles.activeLabel,
          ]}
        >
          {tab.name}
        </Text>
      </Pressable>
    );
  };
  if (isDesktop) {
    return (
      <View
        style={[
          styles.desktopSidebar,
          {
            backgroundColor: colors.background,
            borderRightColor: colors.border,
          },
        ]}
      >
        <View style={styles.brandingHeader}>
          <View
            style={[styles.logoBadge, { backgroundColor: colors.primaryLight }]}
          >
            <MaterialCommunityIcons
              name="school-outline"
              size={24}
              color={colors.primary}
            />
          </View>
          <Text style={[styles.brandTitle, { color: colors.text }]}>
            DigiLearn
          </Text>
        </View>
        <View style={styles.desktopTabList}>
          {state.routes.map((route: TabRoute) => renderTab(route, true))}
        </View>
      </View>
    );
  }
  return (
    <View
      style={[
        styles.container,
        { borderTopColor: colors.border, backgroundColor: colors.background },
      ]}
    >
      {state.routes.map((route: TabRoute) => renderTab(route, false))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopWidth: 1,
  },
  item: { alignItems: "center", justifyContent: "center", minWidth: 56 },
  label: { marginTop: 4, fontSize: 11, fontWeight: "600" },
  activeLabel: { fontWeight: "700" },
  desktopSidebar: {
    width: 220,
    height: "100%",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRightWidth: 1,
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
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  brandTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.5 },
  desktopTabList: { width: "100%", gap: 8 },
  desktopItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: radius.md,
  },
  desktopLabel: { marginLeft: spacing.md, fontSize: 15, fontWeight: "500" },
});
