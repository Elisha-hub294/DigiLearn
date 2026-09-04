import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import { SearchResult } from "../../hooks/useGlobalSearch";

type SearchResultCardProps = {
  item: SearchResult;
  query: string;
  onPress: (item: SearchResult) => void;
};

const BADGE_COLORS: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  topicalNote: { bg: "#006EFF", text: "#FFFFFF", label: "Note" },
  pastPaper: { bg: "#8B5CF6", text: "#FFFFFF", label: "Past Paper" },
  book: { bg: "#F97316", text: "#FFFFFF", label: "Book" },
  video: { bg: "#EF4444", text: "#FFFFFF", label: "Video" },
  teacher: { bg: "#10B981", text: "#FFFFFF", label: "Teacher" },
};

export function SearchResultCard({
  item,
  query,
  onPress,
}: SearchResultCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const badgeInfo = BADGE_COLORS[item.type] || BADGE_COLORS.topicalNote;

  const renderHighlightedTitle = () => {
    const title = item.title || "";
    const trimmedQ = query.trim();

    if (!trimmedQ || trimmedQ.length < 2) {
      return (
        <Text
          style={[styles.titleText, { color: colors.text }]}
          numberOfLines={2}
        >
          {title}
        </Text>
      );
    }

    try {
      const escaped = trimmedQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      const parts = title.split(regex);

      return (
        <Text
          style={[styles.titleText, { color: colors.text }]}
          numberOfLines={2}
        >
          {parts.map((part, index) => {
            const isMatch = part.toLowerCase() === trimmedQ.toLowerCase();
            return (
              <Text
                key={index}
                style={isMatch ? styles.highlightedPart : undefined}
              >
                {part}
              </Text>
            );
          })}
        </Text>
      );
    } catch {
      return (
        <Text
          style={[styles.titleText, { color: colors.text }]}
          numberOfLines={2}
        >
          {title}
        </Text>
      );
    }
  };

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${badgeInfo.label}: ${item.title}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(item)}
        style={[
          styles.card,
          { backgroundColor: colors.white, borderColor: colors.border },
        ]}
      >
        <View style={styles.imageContainer}>
          {item.previewImage ? (
            <Image
              source={{ uri: item.previewImage }}
              style={styles.previewImage}
              contentFit="contain"
              transition={200}
            />
          ) : (
            <View
              style={[
                styles.previewFallback,
                { backgroundColor: colors.border },
              ]}
            />
          )}
        </View>

        <View style={styles.textContainer}>
          <View style={[styles.badge, { backgroundColor: badgeInfo.bg }]}>
            <Text style={[styles.badgeText, { color: badgeInfo.text }]}>
              {badgeInfo.label}
            </Text>
          </View>
          {renderHighlightedTitle()}
          {!!item.description && (
            <Text
              style={[styles.descriptionText, { color: colors.subtitle }]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {item.description}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 16,
  },
  card: {
    minHeight: 84,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
  },
  imageContainer: {
    width: 80,
    height: 64,
    borderRadius: 10,
    backgroundColor: "transparent",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewFallback: { flex: 1 },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  titleText: {
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 20,
  },
  highlightedPart: {
    color: "#4D7CFE",
    fontWeight: "700",
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
  },
});
