import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

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
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onSeeAll ? (
          <Pressable
            onPress={onSeeAll}
            hitSlop={10}
            style={styles.actionButton}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
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
    marginBottom: 20,
  },
  textContainer: { flex: 1 },
  title: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "600",
  },
  subtitle: {
    color: colors.text,
    fontSize: 13,
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "#F0F0F0",
    borderRadius: 50,
  },
  actionText: { color: colors.text, fontSize: 13, fontWeight: "600" },
});
``;
