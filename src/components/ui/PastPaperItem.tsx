import { Feather as Icon } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing } from "../../constants/theme";

export type PastPaperItemData = {
  id: string;
  title: string;
  badge: string;
  new?: boolean;
};

type PastPaperItemProps = {
  item: PastPaperItemData;
};

export const PastPaperItem = ({ item }: PastPaperItemProps) => (
  <View style={styles.row}>
    <View style={styles.left}>
      <View style={styles.iconWrap}>
        <Icon name="file-text" size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.badgeWrap}>
          <Text style={styles.badgeText}>{item.badge}</Text>
          {item.new ? <Text style={styles.newText}>New</Text> : null}
        </View>
      </View>
    </View>
    <Pressable accessibilityRole="button" style={styles.button}>
      <Text style={styles.buttonText}>Open</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  badgeWrap: {
    flexDirection: "row",
    alignItems: "center",
  },
  badgeText: {
    color: colors.subtitle,
    fontSize: 12,
  },
  newText: {
    marginLeft: spacing.sm,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  button: {
    backgroundColor: colors.lightBackground,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
  },
  buttonText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },
});
