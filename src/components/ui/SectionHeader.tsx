import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  actionLabel?: string;
}

export function SectionHeader({
  title,
  subtitle,
  onSeeAll,
  actionLabel = "See all",
}: SectionHeaderProps) {
  const { colors } = useTheme();
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={[styles.title, { color: colors.primary }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.text }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {onSeeAll ? (
          <Pressable
            onPress={onSeeAll}
            hitSlop={10}
            style={[
              styles.actionButton,
              { backgroundColor: colors.lightBackground },
            ]}
          >
            <Text style={[styles.actionText, { color: colors.text }]}>
              {actionLabel}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  textContainer: { flex: 1 },
  title: {
    fontSize: 20,
    fontWeight: "600",
    textTransform: "none",
  },
  subtitle: {
    fontSize: 13,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 50,
  },
  actionText: { fontSize: 13 },
});
