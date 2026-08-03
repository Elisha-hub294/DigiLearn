import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SearchResult } from "../../hooks/useGlobalSearch";

type SearchResultVideoCardProps = {
  item: SearchResult;
  query: string;
  onPress: (item: SearchResult) => void;
};

const DEFAULT_VIDEO_THUMB =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/images/thumb-1.jpeg";

export function SearchResultVideoCard({
  item,
  query,
  onPress,
}: SearchResultVideoCardProps) {
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
        accessibilityLabel={`Watch video: ${item.title}`}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => onPress(item)}
        style={styles.card}
      >
        {/* Type Badge */}
        <View style={styles.badgeWrap}>
          <View style={[styles.badge, { backgroundColor: "#EF4444" }]}>
            <Text style={styles.badgeText}>Video</Text>
          </View>
        </View>

        {/* Thumbnail area */}
        <View style={styles.thumbWrapper}>
          <Image
            source={{ uri: item.previewImage || DEFAULT_VIDEO_THUMB }}
            style={styles.thumbnail}
            contentFit="cover"
            transition={200}
          />

          {/* 18-22% dark overlay for contrast */}
          <View style={styles.overlay} />

          {/* Centered white play button */}
          <View style={styles.playButton}>
            <Feather name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
          </View>

          {/* Duration badge bottom-right */}
          {!!item.duration && (
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{item.duration}</Text>
            </View>
          )}
        </View>

        {/* Video meta details below thumbnail */}
        <View style={styles.infoArea}>
          {renderTitle()}
          <View style={styles.metaRow}>
            <Text style={styles.teacherText} numberOfLines={1}>
              {item.teacher || "Teacher"}
            </Text>
            <Text style={styles.bulletText}>•</Text>
            <Text style={styles.uploadText} numberOfLines={1}>
              {item.uploadedAt || "Recently added"}
            </Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  badgeWrap: {
    marginBottom: 8,
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
  thumbWrapper: {
    width: "100%",
    height: 180,
    borderRadius: 12,
    overflow: "hidden",
    position: "relative",
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.20)",
  },
  playButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  durationBadge: {
    position: "absolute",
    right: 10,
    bottom: 10,
    backgroundColor: "#000000",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  infoArea: {
    marginTop: 10,
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  teacherText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#4B5563",
  },
  bulletText: {
    color: "#9CA3AF",
    fontSize: 12,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#6B7280",
  },
});
