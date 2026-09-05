import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { auth } from "../../firebaseConfig";
import { TopicalNote } from "../components/page/pageTypes";
import { DownloadedResources } from "../components/profile/DownloadedResources";
import { Skeleton } from "../components/ui/Skeleton";
import { getHorizontalPadding } from "../constants/layout";
import { colors, radius, spacing } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";
import { PaperItem, useLibraryData } from "../hooks/useLibraryData";
import {
  useBooksPagination,
  useTrendingLessonsPagination,
} from "../hooks/useLibraryPagination";
import {
  TrendingLesson,
  useTrendingLessons,
} from "../hooks/useTrendingLessons";
import { recordUserActivity } from "../services/activityService";
import { resolveVideoImageSource } from "../utils/videoUtils";

type Book = { id: string; title: string; author: string; image: string };
type ViewMode = "books" | "courses" | "papers" | "pages" | "downloads";

const parsePages = (value: string | string[] | undefined): TopicalNote[] => {
  if (!value) return [];
  const serialized = Array.isArray(value) ? value[0] : value;
  try {
    const parsed = JSON.parse(serialized);
    return Array.isArray(parsed) ? (parsed as TopicalNote[]) : [];
  } catch {
    try {
      const parsed = JSON.parse(decodeURIComponent(serialized));
      return Array.isArray(parsed) ? (parsed as TopicalNote[]) : [];
    } catch {
      return [];
    }
  }
};

export default function SeeAllScreen() {
  const router = useRouter();
  const { colors: themeColors, isDark } = useTheme();
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);
  const params = useLocalSearchParams<{
    type?: string;
    paperType?: string;
    paperYear?: string;
    pages?: string | string[];
  }>();
  const mode: ViewMode =
    params.type === "courses" ||
    params.type === "papers" ||
    params.type === "pages" ||
    params.type === "downloads"
      ? params.type
      : "books";
  const pages = useMemo(() => parsePages(params.pages), [params.pages]);
  const columns = width >= 700 ? 3 : width >= 430 ? 2 : 1;
  const { paperCollections, loading: papersLoading } = useLibraryData();

  // Pagination hooks
  const booksPagination = useBooksPagination();
  const lessonsPagination = useTrendingLessonsPagination();

  // Legacy hook for fallback
  const {
    lessons: legacyLessons,
    loading: legacyCoursesLoading,
    error: coursesError,
  } = useTrendingLessons();

  const [selectedPaperType, setSelectedPaperType] = useState(
    params.paperType?.trim() || "All",
  );
  const [selectedPaperYear, setSelectedPaperYear] = useState(
    params.paperYear?.trim() || "All",
  );

  useEffect(() => {
    void Promise.resolve().then(() =>
      setSelectedPaperType(params.paperType?.trim() || "All"),
    );
  }, [params.paperType]);

  useEffect(() => {
    void Promise.resolve().then(() =>
      setSelectedPaperYear(params.paperYear?.trim() || "All"),
    );
  }, [params.paperYear]);

  const paperTypeOptions = useMemo(() => {
    const types = paperCollections
      .map((section) => section.type.trim())
      .filter(Boolean);
    return [
      "All",
      ...Array.from(new Set(types.map((item) => item.toUpperCase()))),
    ];
  }, [paperCollections]);

  const paperYearOptions = useMemo(() => {
    const years = paperCollections
      .map((section) => section.year.trim())
      .filter(Boolean);
    return ["All", ...Array.from(new Set(years))];
  }, [paperCollections]);

  const papers = useMemo(() => {
    const requestedType =
      selectedPaperType && selectedPaperType !== "All"
        ? selectedPaperType.trim().toLowerCase()
        : "";
    const requestedYear =
      selectedPaperYear && selectedPaperYear !== "All"
        ? selectedPaperYear.trim()
        : "";

    return paperCollections
      .filter((section) => {
        const matchesType =
          !requestedType || section.type.trim().toLowerCase() === requestedType;
        const matchesYear =
          !requestedYear || section.year.trim() === requestedYear;
        return matchesType && matchesYear;
      })
      .flatMap((section) => section.items);
  }, [paperCollections, selectedPaperType, selectedPaperYear]);

  const title =
    mode === "courses"
      ? "Video Lessons"
      : mode === "papers"
        ? (() => {
            const activeType =
              selectedPaperType && selectedPaperType !== "All"
                ? selectedPaperType.trim().toUpperCase()
                : "";
            const activeYear =
              selectedPaperYear && selectedPaperYear !== "All"
                ? selectedPaperYear.trim()
                : "";
            const typePart = activeType ? `${activeType} ` : "";
            return activeYear
              ? `${typePart}${activeYear}`
              : `${typePart}Past Papers`;
          })()
        : mode === "pages"
          ? "Similar Pages"
          : mode === "downloads"
            ? "My Downloads"
            : "Books";

  const data =
    mode === "books"
      ? booksPagination.items
      : mode === "courses"
        ? lessonsPagination.items
        : mode === "papers"
          ? papers
          : pages;

  const loading =
    mode === "books"
      ? booksPagination.loading
      : mode === "courses"
        ? lessonsPagination.loading
        : mode === "papers"
          ? papersLoading
          : false;

  const hasMore =
    mode === "books"
      ? booksPagination.hasMore
      : mode === "courses"
        ? lessonsPagination.hasMore
        : false;

  const handleLoadMore = () => {
    if (
      mode === "books" &&
      booksPagination.hasMore &&
      !booksPagination.loading
    ) {
      booksPagination.loadMore();
    } else if (
      mode === "courses" &&
      lessonsPagination.hasMore &&
      !lessonsPagination.loading
    ) {
      lessonsPagination.loadMore();
    }
  };

  const handleRefresh = () => {
    if (mode === "books") {
      booksPagination.refresh();
    } else if (mode === "courses") {
      lessonsPagination.refresh();
    }
  };

  return (
    <View
      style={[styles.screen, { backgroundColor: themeColors.lightBackground }]}
    >
      <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
        <View
          style={[
            styles.header,
            {
              paddingHorizontal: horizontalPadding,
              backgroundColor: themeColors.white,
            },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
          >
            <Feather name="chevron-left" size={22} color={themeColors.text} />
          </Pressable>
          <View>
            <Text style={[styles.eyebrow, { color: themeColors.primary }]}>
              Explore library
            </Text>
            <Text style={[styles.heading, { color: themeColors.text }]}>
              {title}
            </Text>
          </View>
        </View>
        {mode === "papers" && (
          <View
            style={[
              styles.filterBar,
              {
                backgroundColor: themeColors.white,
                borderBottomColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.filterGroup}>
              <Text
                style={[styles.filterLabel, { color: themeColors.subtitle }]}
              >
                Type
              </Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={paperTypeOptions}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.filterList}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      styles.filterChip,
                      { backgroundColor: themeColors.lightBackground },
                      selectedPaperType === item && {
                        backgroundColor: themeColors.primaryLight,
                        borderColor: themeColors.primary,
                      },
                    ]}
                    onPress={() => setSelectedPaperType(item)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: themeColors.text },
                        selectedPaperType === item && {
                          color: themeColors.primary,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )}
              />
            </View>

            <View style={styles.filterGroup}>
              <Text
                style={[styles.filterLabel, { color: themeColors.subtitle }]}
              >
                Year
              </Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={paperYearOptions}
                keyExtractor={(item) => item}
                contentContainerStyle={styles.filterList}
                renderItem={({ item }) => (
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      styles.filterChip,
                      { backgroundColor: themeColors.lightBackground },
                      selectedPaperYear === item && {
                        backgroundColor: themeColors.primaryLight,
                        borderColor: themeColors.primary,
                      },
                    ]}
                    onPress={() => setSelectedPaperYear(item)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: themeColors.text },
                        selectedPaperYear === item && {
                          color: themeColors.primary,
                        },
                      ]}
                    >
                      {item}
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          </View>
        )}

        {mode === "downloads" ? (
          <DownloadedResources showAll />
        ) : loading ? (
          <View
            style={styles.skeletonGrid}
            accessibilityLabel={`Loading ${title.toLowerCase()}`}
          >
            {[0, 1, 2, 3, 4, 5].map((item) => (
              <View key={item} style={styles.skeletonCard}>
                <Skeleton style={styles.skeletonImage} />
                <Skeleton style={styles.skeletonCardTitle} />
                <Skeleton style={styles.skeletonCardLine} />
              </View>
            ))}
          </View>
        ) : data.length === 0 || (mode === "courses" && coursesError) ? (
          <View style={styles.state}>
            <Text style={[styles.stateTitle, { color: themeColors.text }]}>
              Nothing here yet
            </Text>
            <Text style={[styles.stateText, { color: themeColors.subtitle }]}>
              Check back soon for more {title.toLowerCase()}.
            </Text>
          </View>
        ) : (
          <FlatList
            key={columns}
            data={data}
            numColumns={columns}
            showsVerticalScrollIndicator={false}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={[
              styles.grid,
              { paddingHorizontal: horizontalPadding },
            ]}
            columnWrapperStyle={columns > 1 ? styles.row : undefined}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={loading && data.length === 0}
                onRefresh={handleRefresh}
                tintColor={themeColors.primary}
              />
            }
            ListFooterComponent={
              loading && hasMore ? (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color={themeColors.primary} />
                </View>
              ) : null
            }
            renderItem={({ item }: { item: any }) => (
              <View style={[styles.cell, { width: `${100 / columns}%` }]}>
                {mode === "books" ? (
                  <BookTile
                    item={item}
                    onPress={() => {
                      if (auth.currentUser?.uid)
                        void recordUserActivity(
                          auth.currentUser.uid,
                          "book",
                          item.id,
                        );
                      router.push({
                        pathname: "/book-preview",
                        params: {
                          id: item.id,
                          source: "see-all",
                          returnTo: "/see-all?type=books",
                        },
                      } as any);
                    }}
                  />
                ) : mode === "courses" ? (
                  <CourseTile
                    item={item}
                    isDark={isDark}
                    onPress={() =>
                      router.push({
                        pathname: "/lesson-player",
                        params: {
                          title: item.title,
                          teacher: item.teacher,
                          subject: item.subject,
                          duration: item.duration,
                          description: item.description,
                          link: item.link,
                          thumbnail: item.thumbnail,
                        },
                      } as any)
                    }
                  />
                ) : mode === "pages" ? (
                  <PageTile
                    item={item}
                    onPress={() =>
                      router.push({
                        pathname: "/page-preview",
                        params: {
                          id: item.id,
                          source: "see-all",
                        },
                      } as any)
                    }
                  />
                ) : (
                  <PaperTile
                    item={item}
                    onPress={() =>
                      router.push({
                        pathname: "/paper-preview",
                        params: {
                          id: item.id,
                          title: item.title,
                          subject: item.subject,
                          year: item.year,
                          description: item.description,
                          level: item.level,
                          pageNumber: item.pageNumber,
                          paperCode: item.paperCode,
                          paperNumber: item.paperNumber,
                          image: item.image,
                          document: item.document,
                          type: "Past Paper",
                        },
                      } as any)
                    }
                  />
                )}
              </View>
            )}
          />
        )}
      </View>
    </View>
  );
}

function BookTile({ item, onPress }: { item: Book; onPress: () => void }) {
  const { colors: themeColors } = useTheme();
  return (
    <Pressable
      style={[styles.card, { backgroundColor: themeColors.white }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
    >
      <Image source={item.image} style={styles.bookImage} contentFit="cover" />
      <Text
        style={[styles.cardTitle, { color: themeColors.text }]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <Text
        style={[styles.cardMeta, { color: themeColors.subtitle }]}
        numberOfLines={1}
      >
        {item.author}
      </Text>
    </Pressable>
  );
}

function CourseTile({
  item,
  isDark,
  onPress,
}: {
  item: TrendingLesson;
  isDark: boolean;
  onPress: () => void;
}) {
  const { colors: themeColors } = useTheme();
  return (
    <Pressable
      style={[styles.card, { backgroundColor: themeColors.white }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open lesson: ${item.title}`}
    >
      <View style={styles.courseImageWrap}>
        <Image
          source={resolveVideoImageSource(item.thumbnail, item.link, isDark)}
          style={styles.courseImage}
          contentFit="cover"
        />
        <View style={styles.play}>
          <Feather name="play" size={16} color={colors.white} />
        </View>
        <Text style={styles.duration}>{item.duration}</Text>
      </View>
      <Text
        style={[styles.cardTitle, { color: themeColors.text }]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <Text
        style={[styles.cardMeta, { color: themeColors.subtitle }]}
        numberOfLines={1}
      >
        {item.teacher}
      </Text>
    </Pressable>
  );
}

function PageTile({
  item,
  onPress,
}: {
  item: TopicalNote;
  onPress: () => void;
}) {
  const { colors: themeColors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const cover = item.cover?.trim();

  return (
    <Pressable
      style={[styles.card, { backgroundColor: themeColors.white }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title || "Untitled page"}`}
    >
      {cover && !imageFailed ? (
        <Image
          source={{ uri: cover }}
          style={styles.pageImage}
          contentFit="cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <View
          style={[
            styles.pageImage,
            styles.pageImageFallback,
            { backgroundColor: themeColors.border },
          ]}
        >
          <Feather name="file-text" size={28} color={colors.white} />
        </View>
      )}
      <Text
        style={[styles.cardTitle, { color: themeColors.text }]}
        numberOfLines={2}
      >
        {item.title || "Untitled page"}
      </Text>
      <Text
        style={[styles.cardMeta, { color: themeColors.subtitle }]}
        numberOfLines={1}
      >
        {Array.isArray(item.subject)
          ? item.subject.join(", ")
          : item.subject || "Study note"}
      </Text>
    </Pressable>
  );
}

function PaperTile({
  item,
  onPress,
}: {
  item: PaperItem;
  onPress: () => void;
}) {
  const { colors: themeColors } = useTheme();
  return (
    <Pressable
      style={[styles.card, { backgroundColor: themeColors.white }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
    >
      <Image source={item.image} style={styles.paperImage} contentFit="cover" />
      <Text style={[styles.subject, { color: themeColors.primary }]}>
        {item.subject}
      </Text>
      <Text
        style={[styles.cardTitle, { color: themeColors.text }]}
        numberOfLines={2}
      >
        {item.title}
      </Text>
      <Text style={[styles.cardMeta, { color: themeColors.subtitle }]}>
        {item.year} • {item.pages}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.lightBackground },
  contentContainer: { flex: 1, width: "100%", alignSelf: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    backgroundColor: colors.white,
  },
  filterBar: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15, 23, 42, 0.06)",
  },
  filterGroup: {
    marginBottom: spacing.sm,
  },
  filterLabel: {
    color: colors.subtitle,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  filterList: {
    paddingRight: spacing.md,
    gap: spacing.xs,
  },
  filterChip: {
    backgroundColor: colors.lightBackground,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: "transparent",
  },
  filterChipActive: {
    backgroundColor: colors.primaryLight,
    borderColor: "rgba(0, 110, 255, 0.2)",
  },
  filterChipText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heading: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "700",
    marginTop: 2,
  },
  grid: { padding: spacing.lg, paddingBottom: spacing.xxl },
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    padding: spacing.lg,
  },
  skeletonCard: { width: "47%", gap: spacing.sm, marginBottom: spacing.md },
  skeletonImage: { width: "100%", aspectRatio: 0.9 },
  skeletonCardTitle: { width: "78%", height: 14 },
  skeletonCardLine: { width: "54%", height: 11 },
  row: { alignItems: "flex-start", marginHorizontal: -spacing.xs },
  cell: { paddingHorizontal: spacing.xs, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    overflow: "hidden",
    paddingBottom: spacing.sm,
  },
  bookImage: { width: "100%", aspectRatio: 0.9 },
  courseImageWrap: {
    width: "100%",
    aspectRatio: 1.45,
    position: "relative",
    overflow: "hidden",
  },
  courseImage: { width: "100%", height: "100%" },
  paperImage: { width: "100%", aspectRatio: 1.35 },
  pageImage: { width: "100%", aspectRatio: 1.35 },
  pageImageFallback: {
    backgroundColor: "#64748B",
    alignItems: "center",
    justifyContent: "center",
  },
  play: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryRed,
    alignItems: "center",
    justifyContent: "center",
  },
  duration: {
    position: "absolute",
    right: spacing.sm,
    bottom: spacing.sm,
    color: colors.white,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    fontSize: 11,
  },
  subject: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    marginTop: spacing.sm,
    marginHorizontal: spacing.sm,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: spacing.sm,
  },
  cardMeta: {
    color: colors.subtitle,
    fontSize: 12,
    marginTop: 4,
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  stateText: {
    color: colors.subtitle,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
});
