import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SearchResult } from "../../hooks/useGlobalSearch";

type SearchResultCardProps = {
  item: SearchResult;
  query: string;
  onPress: (item: SearchResult) => void;
};

export function SearchResultCard({
  item,
  query,
  onPress,
}: SearchResultCardProps) {
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

  // Title query highlighting logic
  const renderHighlightedTitle = () => {
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
        <Text style={styles.titleText} numberOfLines={2}>
          {title}
        </Text>
      );
    }
  };

  return (
    <Animated.View style={[styles.wrapper, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${item.title}, ${item.description}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(item)}
        style={styles.card}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.previewImage }}
            style={styles.previewImage}
            contentFit="contain"
            transition={200}
          />
        </View>

        <View style={styles.textContainer}>
          {renderHighlightedTitle()}
          {!!item.description && (
            <Text style={styles.descriptionText} numberOfLines={2} ellipsizeMode="tail">
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
    marginBottom: 18,
  },
  card: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  imageContainer: {
    width: 80,
    height: 60,
    borderRadius: 8,
    backgroundColor: "#F4F4F6",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#202020",
    lineHeight: 21,
  },
  highlightedPart: {
    backgroundColor: "#FFE599",
    color: "#000000",
    fontWeight: "700",
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#8A8A8A",
    lineHeight: 18,
  },
});
