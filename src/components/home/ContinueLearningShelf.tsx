import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { radius, spacing } from "../../constants/theme";
import { getThemeAsset } from "../../constants/themeAssets";
import { useTheme } from "../../contexts/ThemeContext";
import {
  formatPlaybackTime,
  getAllRecentProgress,
  type PlaybackProgress,
} from "../../services/playbackProgressService";
import { SectionHeader } from "../ui/SectionHeader";

export function ContinueLearningShelf() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [recents, setRecents] = useState<PlaybackProgress[]>([]);

  const loadRecents = useCallback(() => {
    void getAllRecentProgress().then((items) => {
      setRecents(items);
    });
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRecents();
    }, [loadRecents]),
  );

  if (recents.length === 0) {
    return null;
  }

  const cardWidth = Math.min(280, Math.max(240, width * 0.72));

  return (
    <Animated.View
      entering={FadeInUp.duration(380)}
      style={styles.container}
    >
      <SectionHeader
        title="Continue Learning"
        actionLabel="Clear"
        onSeeAll={() => setRecents([])}
      />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={recents}
        keyExtractor={(item) => item.lessonId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const formattedTime = formatPlaybackTime(item.positionSeconds);
          const thumbSource = item.thumbnail
            ? { uri: item.thumbnail }
            : getThemeAsset("thumbDefault", isDark);

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Resume lesson: ${item.title}`}
              accessibilityHint={`Resumes video playback at ${formattedTime}`}
              style={[
                styles.card,
                {
                  backgroundColor: colors.white,
                  borderColor: colors.border,
                  width: cardWidth,
                },
              ]}
              onPress={() => {
                router.push({
                  pathname: "/lesson-player",
                  params: {
                    id: item.lessonId,
                    title: item.title,
                    subject: item.subject,
                    teacher: item.teacher,
                    thumbnail: item.thumbnail,
                    link: item.link,
                    duration: item.duration,
                  },
                } as never);
              }}
            >
              <View style={styles.imageContainer}>
                <Image
                  source={thumbSource}
                  style={styles.image}
                  contentFit="cover"
                />
                <View style={styles.overlay} />
                <View
                  style={[
                    styles.subjectBadge,
                    { backgroundColor: colors.lightBackground },
                  ]}
                >
                  <Text
                    style={[styles.subjectText, { color: colors.primary }]}
                    maxFontSizeMultiplier={1.3}
                  >
                    {item.subject?.toUpperCase() ?? "LESSON"}
                  </Text>
                </View>

                <View style={styles.playBadge}>
                  <Ionicons name="play" size={14} color="#FFFFFF" />
                  <Text style={styles.playBadgeText} maxFontSizeMultiplier={1.3}>
                    {formattedTime}
                  </Text>
                </View>
              </View>

              <View style={styles.cardContent}>
                <Text
                  style={[styles.title, { color: colors.text }]}
                  numberOfLines={2}
                  maxFontSizeMultiplier={1.3}
                >
                  {item.title}
                </Text>
                <Text
                  style={[styles.teacher, { color: colors.subtitle }]}
                  numberOfLines={1}
                  maxFontSizeMultiplier={1.3}
                >
                  {item.teacher ?? "DigiLearn Educator"}
                </Text>

                <View
                  style={[
                    styles.resumeButton,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Ionicons name="play-circle" size={16} color="#FFFFFF" />
                  <Text
                    style={styles.resumeButtonText}
                    maxFontSizeMultiplier={1.3}
                  >
                    Resume from {formattedTime}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  listContent: {
    paddingHorizontal: spacing.sm,
    gap: spacing.md,
  },
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  imageContainer: {
    height: 130,
    width: "100%",
    position: "relative",
  },
  image: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
  },
  subjectBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
  },
  subjectText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  playBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    gap: 4,
  },
  playBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
  },
  cardContent: {
    padding: spacing.md,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 4,
  },
  teacher: {
    fontSize: 12,
    marginBottom: 10,
  },
  resumeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
    gap: 6,
  },
  resumeButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
