import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";

interface SectionHeaderProps {
  title: string;
  onSeeAll?: () => void;
  actionLabel?: string;
}

export function SectionHeader({
  title,
  onSeeAll,
  actionLabel = "See all",
}: SectionHeaderProps) {
  return (
    <View>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
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
  },
  textContainer: { flex: 1 },
  title: {
    color: colors.dark,
    fontSize: 20,
    fontWeight: "600",
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
