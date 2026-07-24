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
        <Pressable
          // onPress={() => router.push("/profile")}
          style={styles.notificationButton}
          accessibilityLabel="Open notifications"
        >
          <Icon name="bell" size={30} color={colors.text} />
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
  },
  notificationButton: {
    width: 45,
    height: 45,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 11,
    height: 11,
    borderRadius: 4.5,
    backgroundColor: "#ff0000",
    borderWidth: 2,
    borderColor: colors.white,
  },
});
