import { Feather as Icon } from "@expo/vector-icons";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";

type TabRoute = {
  key: string;
  name: string;
};

const tabs = [
  { name: "Home", icon: "book", route: "index" },
  { name: "Library", icon: "archive", route: "library" },
  { name: "Courses", icon: "play-circle", route: "videos" },
  { name: "Account", icon: "user", route: "profile" },
] as const;

export const BottomTabBar = ({ state, navigation }: BottomTabBarProps) => {
  const activeRoute = state.routes[state.index];

  if (
    activeRoute?.name === "book-preview" ||
    activeRoute?.name === "lesson-player"
  ) {
    return null;
  }

  return (
    <View style={styles.container}>
      {state.routes.map((route: TabRoute) => {
        const tab = tabs.find((t) => t.route === route.name);

        if (!tab) return null;

        const isActive = state.routes[state.index].key === route.key;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isActive && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <Pressable key={route.key} onPress={onPress} style={styles.item}>
            <Icon
              name={tab.icon as any}
              size={19}
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
  container: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
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
});
