import { Feather as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";

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
        <Text style={styles.greeting}>
          Hi, <Text style={{ color: colors.primary }}>Elisha</Text>
        </Text>
      </View>
      <View style={styles.actions}>
        <View style={styles.streakPill}>
          <Icon name="zap" size={14} color={colors.green} />
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
    alignItems: "flex-end",
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
    color: colors.dark,
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: colors.purple,
    borderRadius: 100,
    padding: 5,
  },
  streakPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.white,
    gap: 6,
  },
  streakText: { color: colors.dark, fontSize: 12, fontWeight: "500" },
  notificationButton: {
    width: 32,
    height: 32,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    position: "relative",
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
