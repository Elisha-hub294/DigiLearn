import { Feather as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing } from "../../constants/theme";

export const Header = () => {
  const router = useRouter();
  const date = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text style={styles.date}>{date}</Text>
        <Text style={styles.greeting}>Hi, Elisha</Text>
      </View>
      <View style={styles.actions}>
        <View style={styles.streakPill}>
          <Icon name="zap" size={14} color={colors.primary} />
          <Text style={styles.streakText}>7 day streak</Text>
        </View>
        <Pressable
          onPress={() => router.push("/profile")}
          style={styles.notificationButton}
          accessibilityLabel="Open notifications"
        >
          <Icon name="bell" size={18} color={colors.text} />
          <View style={styles.badge} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.xl,
  },
  textWrap: { flex: 1, paddingRight: spacing.md },
  date: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  greeting: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    ...shadows.soft,
    gap: 6,
  },
  streakText: { color: colors.text, fontSize: 12, fontWeight: "700" },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    position: "relative",
    ...shadows.soft,
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: "#FF5D5D",
    borderWidth: 2,
    borderColor: colors.white,
  },
});
