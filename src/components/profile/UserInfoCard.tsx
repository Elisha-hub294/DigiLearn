import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import type { UserProfile } from "../../services/userProfile";

type ProfileStatProps = {
  icon: ComponentProps<typeof Feather>["name"];
  label: string;
  value: string;
  interactive?: boolean;
  onPress?: () => void;
};

/** A deliberately uniform profile statistic: each column reserves equal vertical space. */
function ProfileStat({
  icon,
  label,
  value,
  interactive = false,
  onPress,
}: ProfileStatProps) {
  const { colors } = useTheme();
  const valueContent = (
    <Text
      numberOfLines={1}
      ellipsizeMode="tail"
      style={[styles.value, interactive && styles.interactiveValue]}
    >
      {value}
    </Text>
  );
  return (
    <View style={styles.stat}>
      <Feather name={icon} size={32} color={colors.primary} />
      <Text style={[styles.label, { color: colors.subtitle }]}>{label}</Text>
      {interactive ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={value}
          style={({ pressed }) => [
            styles.valueAction,
            pressed && styles.valuePressed,
          ]}
        >
          {valueContent}
        </Pressable>
      ) : (
        <View style={styles.valueAction}>{valueContent}</View>
      )}
    </View>
  );
}

function joinedDate(value: unknown) {
  const date =
    (value as any)?.toDate?.() ??
    (value ? new Date(value as string | number) : null);
  return date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString(undefined, { month: "short", year: "numeric" })
    : "—";
}

export function UserInfoCard({ profile }: { profile: UserProfile }) {
  const hasLevel = Boolean(profile.level?.trim());
  const hasSchool = Boolean(profile.school?.trim());
  return (
    <View style={styles.row} accessibilityLabel="Profile information">
      <ProfileStat
        icon="calendar"
        label="Joined"
        value={joinedDate(profile.joinedAt)}
      />
      <ProfileStat
        icon="award"
        label="Level"
        value={hasLevel ? profile.level : "Set Level"}
        interactive={!hasLevel}
        onPress={() => undefined}
      />
      <ProfileStat
        icon="home"
        label="School"
        value={hasSchool ? profile.school : "Add School"}
        interactive={!hasSchool}
        onPress={() => undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  stat: {
    flex: 1,
    minWidth: 0,
    height: 84,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  label: {
    marginTop: 7,
    color: "#777777",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 15,
  },
  valueAction: {
    width: "100%",
    minHeight: 18,
    marginTop: 2,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  value: {
    width: "100%",
    color: "#8A8A8A",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
  },
  interactiveValue: { color: "#3B82F6", fontWeight: "700" },
  valuePressed: { opacity: 0.62, transform: [{ scale: 0.97 }] },
});
