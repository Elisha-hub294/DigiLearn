import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import type { UserProfile } from "../../services/userProfile";



function joinedDate(value: unknown) {
  const date =
    (value as any)?.toDate?.() ??
    (value ? new Date(value as string | number) : null);
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "—";
}

export function UserInfoCard({ profile }: { profile: UserProfile }) {
  const router = useRouter();
  const { colors: themeColors } = useTheme();
  const hasLevel = Boolean(profile.level?.trim());
  const hasSchool = Boolean(profile.school?.trim());

  return (
    <View style={styles.container} accessibilityLabel="Profile information">
      {/* Joined Stat */}
      <View style={[styles.card, { backgroundColor: themeColors.surface, borderColor: themeColors.border }]}>
        <View style={[styles.iconBadge, { backgroundColor: themeColors.primaryLight }]}>
          <Feather name="calendar" size={18} color={themeColors.primary} />
        </View>
        <Text style={[styles.label, { color: themeColors.subtitle }]}>Joined</Text>
        <Text style={[styles.value, { color: themeColors.text }]} numberOfLines={1}>
          {joinedDate(profile.joinedAt)}
        </Text>
      </View>

      {/* Level Stat */}
      <Pressable
        onPress={() => router.push("/my-profile")}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`Level: ${hasLevel ? profile.level : "Set Level"}`}
      >
        <View style={[styles.iconBadge, { backgroundColor: "rgba(184, 154, 248, 0.2)" }]}>
          <Feather name="award" size={18} color={themeColors.purple || "#8B5CF6"} />
        </View>
        <Text style={[styles.label, { color: themeColors.subtitle }]}>Level</Text>
        <Text
          style={[
            styles.value,
            { color: hasLevel ? themeColors.text : themeColors.primary },
            styles.interactiveValue,
          ]}
          numberOfLines={1}
        >
          {hasLevel ? profile.level : "+ Set Level"}
        </Text>
      </Pressable>

      {/* School Stat */}
      <Pressable
        onPress={() => router.push("/my-profile")}
        style={({ pressed }) => [
          styles.card,
          { backgroundColor: themeColors.surface, borderColor: themeColors.border },
          pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`School: ${hasSchool ? profile.school : "Add School"}`}
      >
        <View style={[styles.iconBadge, { backgroundColor: "rgba(107, 203, 119, 0.2)" }]}>
          <Feather name="book-open" size={18} color={themeColors.green || "#10B981"} />
        </View>
        <Text style={[styles.label, { color: themeColors.subtitle }]}>School</Text>
        <Text
          style={[
            styles.value,
            { color: hasSchool ? themeColors.text : themeColors.primary },
            styles.interactiveValue,
          ]}
          numberOfLines={1}
        >
          {hasSchool ? profile.school : "+ Add School"}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    maxWidth: 560,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
    gap: 10,
    marginVertical: 12,
  },
  card: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  value: {
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
  },
  interactiveValue: {
    fontWeight: "700",
  },
});
