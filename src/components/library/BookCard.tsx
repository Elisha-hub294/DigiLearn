import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";

type BookCardItem = {
  id: string;
  title: string;
  author: string;
  description: string;
  image: any;
  progress?: number;
  badge?: string;
};

type BookCardProps = {
  item: BookCardItem;
  onPress?: () => void;
};

export function BookCard({ item, onPress }: BookCardProps) {
  return (
    <Pressable accessibilityRole="button" style={styles.card} onPress={onPress}>
      <Image source={item.image} style={styles.image} contentFit="cover" />
      <View>
        <View style={styles.badgeRow}>
          {item.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          ) : null}
          {typeof item.progress === "number" ? (
            <View style={styles.progressLabel}>
              <Text style={styles.progressText}>{item.progress}%</Text>
            </View>
          ) : null}
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.author}>{item.author}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    marginRight: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
    overflow: "hidden",
    marginBottom: spacing.md,
  },
  image: {
    width: "100%",
    height: 170,
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  badge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
  },
  progressLabel: {
    backgroundColor: "#FFF4DA",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  progressText: {
    color: "#B17A00",
    fontSize: 10,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 4,
  },
  author: {
    color: colors.subtitle,
    fontSize: 12,
    marginBottom: 6,
  },
  description: {
    color: colors.subtitle,
    fontSize: 11,
    lineHeight: 16,
  },
});
