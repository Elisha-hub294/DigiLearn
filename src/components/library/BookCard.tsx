import { FirebaseImage as Image } from "@/components/ui/FirebaseImage";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";
import { getThemeAsset } from "../../constants/themeAssets";
import { useTheme } from "../../contexts/ThemeContext";
import { ResourceDeleteMenu } from "../ui/ResourceDeleteMenu";

type BookCardItem = {
  id: string;
  title: string;
  author: string;
  description: string;
  image: any;
  progress?: number;
  badge?: string;
  owner?: string;
};

type BookCardProps = {
  item: BookCardItem;
  onPress?: () => void;
  width?: number;
  marginRight?: number;
};

export function BookCard({
  item,
  onPress,
  width = 200,
  marginRight = spacing.md,
}: BookCardProps) {
  const { colors, isDark } = useTheme();
  const fallbackCover = getThemeAsset("bookCoverDefault", isDark);
  return (
    <Pressable
      accessibilityRole="button"
      style={[
        styles.card,
        { width, marginRight, backgroundColor: colors.white },
      ]}
      onPress={onPress}
    >
      <Image
        source={item.image || fallbackCover}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.menu}>
        <ResourceDeleteMenu
          collection="books"
          id={item.id}
          title={item.title}
          data={{ owner: item.owner, cover: item.image }}
          light
        />
      </View>
      <View>
        <View style={styles.badgeRow}>
          {item.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.badge}</Text>
            </View>
          ) : null}
          {typeof item.progress === "number" ? (
            <View
              style={[
                styles.progressLabel,
                { backgroundColor: colors.lightBackground },
              ]}
            >
              <Text style={[styles.progressText, { color: colors.primary }]}>
                {item.progress}%
              </Text>
            </View>
          ) : null}
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.author, { color: colors.subtitle }]}>
          {item.author}
        </Text>
        <Text
          style={[styles.description, { color: colors.subtitle }]}
          numberOfLines={2}
        >
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
    overflow: "hidden",
    marginBottom: spacing.md,
    position: "relative",
  },
  menu: { position: "absolute", top: 6, right: 6, zIndex: 2 },
  image: {
    width: "100%",
    height: 300,
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
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  progressText: {
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
