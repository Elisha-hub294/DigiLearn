import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
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
  clearPageReadingProgress,
  getRecentReadingProgressList,
  type ReadingProgress,
} from "../../services/readingProgressService";
import { SectionHeader } from "../ui/SectionHeader";

const MAX_CONTINUE_ITEMS = 5;

export function ContinueLearningShelf() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [recents, setRecents] = useState<ReadingProgress[]>([]);

  const loadRecents = useCallback(() => {
    void getRecentReadingProgressList().then((items) => {
      setRecents(items.slice(0, MAX_CONTINUE_ITEMS));
    });
  }, []);

  const clearRecents = useCallback(async () => {
    const itemsToClear = recents;
    setRecents([]);
    await Promise.all(
      itemsToClear.map((item) => clearPageReadingProgress(item.pageId)),
    );
  }, [recents]);

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
    <Animated.View entering={FadeInUp.duration(380)} style={styles.container}>
      <SectionHeader
        title="Continue Learning"
        actionLabel="Clear"
        onSeeAll={() => {
          void clearRecents();
        }}
      />

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        data={recents}
        keyExtractor={(item) => item.pageId}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const thumbSource = item.cover
            ? { uri: item.cover }
            : getThemeAsset("thumbDefault", isDark);

          return (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Continue reading: ${item.title}`}
              accessibilityHint={`Opens this page at page ${item.lastPage}`}
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
                  pathname: "/pdf-reader",
                  params: {
                    pageId: item.pageId,
                    title: item.title,
                    document: item.documentUri,
                    initialPage: String(item.lastPage),
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
                    {item.subject?.toUpperCase() ?? "PAGE"}
                  </Text>
                </View>

                <View style={styles.playBadge}>
                  <Ionicons name="document-text" size={14} color="#FFFFFF" />
                  <Text
                    style={styles.playBadgeText}
                    maxFontSizeMultiplier={1.3}
                  >
                    Page {item.lastPage}
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
                  {item.documentUri ? "DigiLearn Page" : "Page document"}
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
                    Continue from page {item.lastPage}
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
