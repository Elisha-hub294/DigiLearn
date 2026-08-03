import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SearchResult } from "../../hooks/useGlobalSearch";

type SearchResultBookCardProps = {
  item: SearchResult;
  query: string;
  onPress: (item: SearchResult) => void;
};

const DEFAULT_BOOK_COVER =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/images/lib.jpeg";

export function SearchResultBookCard({
  item,
  query,
  onPress,
}: SearchResultBookCardProps) {
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

  const renderTitle = () => {
    const title = item.title || "";
    const trimmedQ = query.trim();
    if (!trimmedQ || trimmedQ.length < 2) {
      return (
        <Text style={styles.titleText} numberOfLines={2}>
          {title}
        </Text>
      );
    }
    try {
      const escaped = trimmedQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      const parts = title.split(regex);

      return (
        <Text style={styles.titleText} numberOfLines={2}>
          {parts.map((part, idx) => {
            const isMatch = part.toLowerCase() === trimmedQ.toLowerCase();
            return (
              <Text key={idx} style={isMatch ? styles.highlightText : undefined}>
                {part}
              </Text>
            );
          })}
        </Text>
      );
    } catch {
      return (
        <Text style={styles.titleText} numberOfLines={2}>
          {title}
        </Text>
      );
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`View book: ${item.title}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(item)}
        style={styles.card}
      >
        <View style={styles.badgeWrap}>
          <View style={[styles.badge, { backgroundColor: "#F97316" }]}>
            <Text style={styles.badgeText}>Book</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.coverWrapper}>
            <Image
              source={{
                uri:
                  item.rawItem?.cover ||
                  item.previewImage ||
                  item.rawItem?.image ||
                  item.rawItem?.avatar ||
                  DEFAULT_BOOK_COVER,
              }}
              style={styles.coverImage}
              contentFit="cover"
              transition={200}
            />
          </View>

          <View style={styles.textContainer}>
            {renderTitle()}
            <Text style={styles.authorText} numberOfLines={1}>
              {item.author || item.subtitle || "Author"}
            </Text>
            {!!item.description && (
              <Text style={styles.descText} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  badgeWrap: {
    marginBottom: 10,
  },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  cardBody: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  coverWrapper: {
    width: 76,
    height: 104,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  coverImage: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
    lineHeight: 22,
  },
  highlightText: {
    color: "#4D7CFE",
    fontWeight: "700",
  },
  authorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#006EFF",
  },
  descText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
    lineHeight: 18,
  },
});
