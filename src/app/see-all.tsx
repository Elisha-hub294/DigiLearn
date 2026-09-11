import { Feather, FontAwesome } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  LayoutChangeEvent,
  Modal,
  Platform,
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
import { ActionDialog } from "../components/ui/ActionDialog";
import { Skeleton } from "../components/ui/Skeleton";
import { getHorizontalPadding } from "../constants/layout";
import { colors, radius, spacing } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";
import { PaperItem, useLibraryData } from "../hooks/useLibraryData";
import {
  useBooksPagination,
  useTrendingLessonsPagination,
} from "../hooks/useLibraryPagination";
import type { TrendingLesson } from "../hooks/useTrendingLessons";
import { recordUserActivity } from "../services/activityService";
import {
  getSavedItemsProfile,
  toggleSavedItem,
  type SavedItemType,
} from "../services/userProfile";
import { resolveVideoImageSource } from "../utils/videoUtils";

type Book = { id: string; title: string; author: string; image: string };
type ViewMode =
  | "books"
  | "courses"
  | "papers"
  | "pages"
  | "downloads"
  | "post-images";

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

const parseImages = (value: string | string[] | undefined): string[] => {
  if (!value) return [];
  const serialized = Array.isArray(value) ? value[0] : value;
  try {
    const parsed = JSON.parse(serialized);
    return Array.isArray(parsed) ? (parsed as string[]) : [String(parsed)];
  } catch {
    try {
      const parsed = JSON.parse(decodeURIComponent(serialized));
      return Array.isArray(parsed) ? (parsed as string[]) : [String(parsed)];
    } catch {
      return [serialized];
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
    title?: string;
    images?: string | string[];
    initialIndex?: string;
  }>();
  const mode: ViewMode =
    params.type === "courses" ||
    params.type === "papers" ||
    params.type === "pages" ||
    params.type === "downloads" ||
    params.type === "post-images" ||
    params.type === "images"
      ? params.type === "images"
        ? "post-images"
        : (params.type as ViewMode)
      : "books";
  const pages = useMemo(() => parsePages(params.pages), [params.pages]);
  const postImages = useMemo(
    () => parseImages(params.images),
    [params.images],
  );
  const [selectedLightboxIndex, setSelectedLightboxIndex] = useState<
    number | null
  >(() => {
    if (params.initialIndex !== undefined) {
      const parsed = parseInt(String(params.initialIndex), 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  });
  const minimumCardWidth =
    mode === "post-images"
      ? contentMaxWidth >= 900
        ? 260
        : contentMaxWidth >= 600
          ? 200
          : 150
      : contentMaxWidth >= 900
        ? 220
        : contentMaxWidth >= 600
          ? 180
          : 145;
  const columns = Math.max(
    1,
    Math.min(
      mode === "post-images" ? 4 : 3,
      Math.floor(contentMaxWidth / minimumCardWidth),
    ),
  );
  const { paperCollections, loading: papersLoading } = useLibraryData();

  // Pagination hooks
  const booksPagination = useBooksPagination();
  const lessonsPagination = useTrendingLessonsPagination();

  const [selectedPaperType, setSelectedPaperType] = useState(
    params.paperType?.trim() || "All",
  );
  const [selectedPaperYear, setSelectedPaperYear] = useState(
    params.paperYear?.trim() || "All",
  );
  const [filterVersion, setFilterVersion] = useState(0);

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
            : mode === "post-images"
              ? params.title || "Post Photos"
              : "Books";

  const postImageData = useMemo(
    () => postImages.map((uri, idx) => ({ id: `img-${idx}`, uri, index: idx })),
    [postImages],
  );

  const data =
    mode === "books"
      ? booksPagination.items
      : mode === "courses"
        ? lessonsPagination.items
        : mode === "papers"
          ? papers
          : mode === "post-images"
            ? postImageData
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
              {mode === "post-images"
                ? "Teacher Announcement"
                : "Explore library"}
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
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={paperTypeOptions}
                keyExtractor={(item) => item}
                style={styles.filterOptions}
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
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={paperYearOptions}
                keyExtractor={(item) => item}
                style={styles.filterOptions}
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
              {(selectedPaperType !== "All" || selectedPaperYear !== "All") && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Clear paper filters"
                  style={styles.clearFilters}
                  onPress={() => {
                    setSelectedPaperType("All");
                    setSelectedPaperYear("All");
                    setFilterVersion((value) => value + 1);
                  }}
                >
                  <Feather
                    name="x-circle"
                    size={15}
                    color={themeColors.primary}
                  />
                  <Text
                    style={[
                      styles.clearFiltersText,
                      { color: themeColors.primary },
                    ]}
                  >
                    Clear
                  </Text>
                </Pressable>
              )}
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
              <View
                key={item}
                style={[styles.skeletonCard, { width: `${100 / columns}%` }]}
              >
                <Skeleton style={styles.skeletonImage} />
                <Skeleton style={styles.skeletonCardTitle} />
                <Skeleton style={styles.skeletonCardLine} />
              </View>
            ))}
          </View>
        ) : data.length === 0 ||
          (mode === "courses" && lessonsPagination.error) ? (
          <View style={styles.state}>
            <Feather
              name={lessonsPagination.error ? "wifi-off" : "inbox"}
              size={30}
              color={themeColors.subtitle}
            />
            <Text style={[styles.stateTitle, { color: themeColors.text }]}>
              {lessonsPagination.error
                ? "Could not load resources"
                : "Nothing here yet"}
            </Text>
            <Text style={[styles.stateText, { color: themeColors.subtitle }]}>
              {lessonsPagination.error
                ? "Check your connection and try again."
                : mode === "papers" &&
                    (selectedPaperType !== "All" || selectedPaperYear !== "All")
                  ? "Try clearing the filters to see all past papers."
                  : `Check back soon for more ${title.toLowerCase()}.`}
            </Text>
            {(lessonsPagination.error ||
              (mode === "papers" &&
                (selectedPaperType !== "All" ||
                  selectedPaperYear !== "All"))) && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  lessonsPagination.error ? "Retry loading" : "Clear filters"
                }
                style={[
                  styles.retryButton,
                  { backgroundColor: themeColors.primary },
                ]}
                onPress={() => {
                  if (lessonsPagination.error) void lessonsPagination.refresh();
                  setSelectedPaperType("All");
                  setSelectedPaperYear("All");
                  setFilterVersion((value) => value + 1);
                }}
              >
                <Text style={styles.retryText}>
                  {lessonsPagination.error ? "Try again" : "Clear filters"}
                </Text>
              </Pressable>
            )}
          </View>
        ) : (
          <FlatList
            key={`${columns}-${filterVersion}`}
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
                ) : mode === "post-images" ? (
                  <PostPhotoTile
                    item={item}
                    onPress={() => setSelectedLightboxIndex(item.index)}
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

        {/* Fullscreen Photo Lightbox Modal */}
        <Modal
          visible={selectedLightboxIndex !== null && mode === "post-images"}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedLightboxIndex(null)}
        >
          {selectedLightboxIndex !== null &&
          postImages[selectedLightboxIndex] ? (
            <View style={styles.lightboxBackdrop}>
              {/* Top Bar */}
              <View style={styles.lightboxHeader}>
                <Text style={styles.lightboxCounter}>
                  {selectedLightboxIndex + 1} of {postImages.length}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close lightbox"
                  style={styles.lightboxCloseButton}
                  onPress={() => setSelectedLightboxIndex(null)}
                >
                  <Feather name="x" size={22} color="#ffffff" />
                </Pressable>
              </View>

              {/* Main Image Display with Navigation Arrows */}
              <View style={styles.lightboxMain}>
                {selectedLightboxIndex > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Previous image"
                    style={styles.lightboxNavLeft}
                    onPress={() =>
                      setSelectedLightboxIndex((prev) =>
                        prev !== null ? Math.max(0, prev - 1) : 0,
                      )
                    }
                  >
                    <Feather name="chevron-left" size={26} color="#ffffff" />
                  </Pressable>
                )}

                <Image
                  source={{ uri: postImages[selectedLightboxIndex] }}
                  style={styles.lightboxImage}
                  contentFit="contain"
                />

                {selectedLightboxIndex < postImages.length - 1 && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Next image"
                    style={styles.lightboxNavRight}
                    onPress={() =>
                      setSelectedLightboxIndex((prev) =>
                        prev !== null
                          ? Math.min(postImages.length - 1, prev + 1)
                          : 0,
                      )
                    }
                  >
                    <Feather name="chevron-right" size={26} color="#ffffff" />
                  </Pressable>
                )}
              </View>

              {/* Bottom Thumbnail Strip */}
              {postImages.length > 1 && (
                <View style={styles.lightboxThumbnailsBar}>
                  <FlatList
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    data={postImages}
                    keyExtractor={(uri, idx) => `thumb-${idx}-${uri}`}
                    renderItem={({ item: uri, index }) => (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`View photo ${index + 1}`}
                        style={[
                          styles.lightboxThumb,
                          selectedLightboxIndex === index &&
                            styles.lightboxThumbSelected,
                        ]}
                        onPress={() => setSelectedLightboxIndex(index)}
                      >
                        <Image
                          source={{ uri }}
                          style={styles.lightboxThumbImage}
                          contentFit="cover"
                        />
                      </Pressable>
                    )}
                  />
                </View>
              )}
            </View>
          ) : null}
        </Modal>
      </View>
    </View>
  );
}

function PostPhotoTile({
  item,
  onPress,
}: {
  item: { id: string; uri: string; index: number };
  onPress: () => void;
}) {
  const { colors: themeColors } = useTheme();
  return (
    <View
      style={[
        styles.photoTile,
        {
          backgroundColor: themeColors.white,
          borderColor: themeColors.border,
        },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open photo ${item.index + 1}`}
        style={styles.cardPressable}
        onPress={onPress}
      >
        <Image
          source={{ uri: item.uri }}
          style={styles.photoTileImage}
          contentFit="cover"
          transition={180}
        />
        <View style={styles.photoIndexTag}>
          <Text style={styles.photoIndexText}>{item.index + 1}</Text>
        </View>
      </Pressable>
    </View>
  );
}

function BookTile({ item, onPress }: { item: Book; onPress: () => void }) {
  const { colors: themeColors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const [cardWidth, setCardWidth] = useState(0);
  const [coverRatio, setCoverRatio] = useState<number | null>(null);
  const imageHeight =
    coverRatio !== null && coverRatio >= 1
      ? Math.min(220, Math.max(140, cardWidth * 0.52))
      : Math.min(360, Math.max(190, cardWidth / 0.72));
  const imageStyle = [styles.bookImage, { height: imageHeight }];

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== cardWidth) setCardWidth(nextWidth);
  };

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.card,
        { backgroundColor: themeColors.white, borderColor: themeColors.border },
      ]}
    >
      <Pressable
        style={({ pressed, hovered }) => [
          styles.cardPressable,
          hovered && styles.cardHovered,
          pressed && styles.cardPressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
      >
        <View style={styles.bookCoverFrame}>
          {imageFailed ? (
            <View
              style={[
                imageStyle,
                styles.imageFallback,
                { backgroundColor: themeColors.border },
              ]}
            >
              <Feather name="book-open" size={30} color={themeColors.white} />
            </View>
          ) : (
            <Image
              source={item.image}
              style={imageStyle}
              contentFit="cover"
              onLoad={(event) => {
                const { width: imageWidth, height: imageHeight } = event.source;
                const nextRatio = imageWidth / imageHeight;
                setCoverRatio((current) =>
                  current === nextRatio ? current : nextRatio,
                );
              }}
              onError={() => setImageFailed(true)}
            />
          )}
          <View
            style={[
              styles.bookTypeBadge,
              {
                backgroundColor: themeColors.surface,
              },
            ]}
          >
            <Feather name="book" size={12} color={themeColors.text} />
          </View>
        </View>
        <View style={styles.cardContent}>
          <Text
            style={[styles.cardTitle, { color: themeColors.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <View style={styles.authorRow}>
            <Feather name="user" size={13} color={themeColors.subtitle} />
            <Text
              style={[styles.cardMeta, { color: themeColors.subtitle }]}
              numberOfLines={1}
            >
              {item.author || "Unknown author"}
            </Text>
          </View>
        </View>
      </Pressable>
      <View style={styles.saveRow}>
        <SaveButton
          itemId={item.id}
          itemType="saved-books"
          label={`Save ${item.title}`}
        />
      </View>
    </View>
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
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.white, borderColor: themeColors.border },
      ]}
    >
      <Pressable
        style={({ pressed, hovered }) => [
          styles.cardPressable,
          hovered && styles.cardHovered,
          pressed && styles.cardPressed,
        ]}
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
        <View style={styles.cardContent}>
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
        </View>
      </Pressable>
      <SaveButton
        itemId={item.id}
        itemType="saved-lessons"
        label={`Save ${item.title}`}
      />
    </View>
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
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.white, borderColor: themeColors.border },
      ]}
    >
      <Pressable
        style={({ pressed, hovered }) => [
          styles.cardPressable,
          hovered && styles.cardHovered,
          pressed && styles.cardPressed,
        ]}
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
        <View style={styles.cardContent}>
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
        </View>
      </Pressable>
      <SaveButton
        itemId={item.id}
        itemType="saved-pages"
        label={`Save ${item.title || "study note"}`}
      />
    </View>
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
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.white, borderColor: themeColors.border },
      ]}
    >
      <Pressable
        style={({ pressed, hovered }) => [
          styles.cardPressable,
          hovered && styles.cardHovered,
          pressed && styles.cardPressed,
        ]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Open ${item.title}`}
      >
        <Image
          source={item.image}
          style={styles.paperImage}
          contentFit="cover"
        />
        <View style={styles.cardContent}>
          <Text style={[styles.subject, { color: themeColors.primary }]}>
            {item.subject}
          </Text>
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
            {item.year} • {item.pages}
          </Text>
        </View>
      </Pressable>
      <SaveButton
        itemId={item.id}
        itemType="saved-papers"
        label={`Save ${item.title}`}
      />
    </View>
  );
}

function SaveButton({
  itemId,
  itemType,
  label,
}: {
  itemId: string;
  itemType: SavedItemType;
  label: string;
}) {
  const { colors: themeColors } = useTheme();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{
    title: string;
    message: string;
    icon: "info" | "alert-circle";
  } | null>(null);

  useEffect(() => {
    let active = true;
    const userId = auth.currentUser?.uid;
    if (!userId) return () => undefined;
    void getSavedItemsProfile(userId).then((profile) => {
      if (active) setSaved(Boolean(profile?.[itemType]?.includes(itemId)));
    });
    return () => {
      active = false;
    };
  }, [itemId, itemType]);

  const handleSave = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      setDialog({
        title: "Sign in to save",
        message: "Create an account to save resources for later.",
        icon: "info",
      });
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await toggleSavedItem(userId, itemType, itemId, saved);
      setSaved((value) => !value);
    } catch {
      setDialog({
        title: "Could not save resource",
        message: "Please try again.",
        icon: "alert-circle",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: saving, selected: saved }}
      hitSlop={8}
      style={({ pressed }) => [
        styles.saveButton,
        pressed && styles.savePressed,
      ]}
      onPress={handleSave}
    >
      {saved ? (
        <FontAwesome name="bookmark" size={16} color={themeColors.primary} />
      ) : (
        <Feather name="bookmark" size={16} color={themeColors.primary} />
      )}
      <Text style={[styles.saveText, { color: themeColors.primary }]}>
        {saved ? "Saved" : "Save"}
      </Text>
      <ActionDialog
        visible={dialog !== null}
        title={dialog?.title ?? ""}
        message={dialog?.message ?? ""}
        primaryText="OK"
        onPrimary={() => setDialog(null)}
        onClose={() => setDialog(null)}
        icon={
          dialog ? (
            <Feather name={dialog.icon} size={24} color={themeColors.primary} />
          ) : undefined
        }
      />
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15, 23, 42, 0.06)",
  },
  filterGroup: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 38,
    marginBottom: spacing.xs,
  },
  filterOptions: {
    flex: 1,
  },
  filterList: {
    paddingRight: spacing.sm,
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
  clearFilters: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
    alignSelf: "flex-start",
    minHeight: 34,
    paddingHorizontal: spacing.xs,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: "700",
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
  row: { alignItems: "stretch", marginHorizontal: -spacing.xs },
  cell: { paddingHorizontal: spacing.xs, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "transparent",
  },
  cardPressable: {
    flexGrow: 1,
    width: "100%",
  },
  cardContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  cardHovered: {
    borderColor: "rgba(0, 110, 255, 0.25)",
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  bookCoverFrame: {
    width: "100%",
    alignSelf: "stretch",
    position: "relative",
    backgroundColor: colors.lightBackground,
  },
  bookImage: {
    width: "100%",
    alignSelf: "stretch",
    backgroundColor: colors.lightBackground,
  },
  bookTypeBadge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  bookTypeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    minHeight: 22,
  },
  saveRow: {
    marginHorizontal: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(15, 23, 42, 0.08)",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  courseImageWrap: {
    width: "100%",
    alignSelf: "stretch",
    aspectRatio: 1.45,
    position: "relative",
    overflow: "hidden",
  },
  courseImage: { width: "100%", height: "100%", alignSelf: "stretch" },
  paperImage: { width: "100%", alignSelf: "stretch", aspectRatio: 1.35 },
  pageImage: { width: "100%", alignSelf: "stretch", aspectRatio: 1.35 },
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
  },
  cardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: spacing.xs,
    lineHeight: 20,
    minHeight: 38,
  },
  cardMeta: {
    color: colors.subtitle,
    fontSize: 12,
    lineHeight: 17,
    minHeight: 17,
  },
  saveButton: {
    alignItems: "center",
    flexDirection: "row",
    minHeight: 40,
    marginHorizontal: spacing.md,
  },
  savePressed: {
    opacity: 0.65,
  },
  saveText: {
    fontSize: 12,
    fontWeight: "700",
  },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    minHeight: 240,
  },
  stateTitle: { color: colors.text, fontSize: 18, fontWeight: "700" },
  stateText: {
    color: colors.subtitle,
    fontSize: 13,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  retryButton: {
    alignItems: "center",
    borderRadius: radius.sm,
    minHeight: 44,
    justifyContent: "center",
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  retryText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 13,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  photoTile: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
    marginBottom: spacing.md,
  },
  photoTileImage: {
    width: "100%",
    height: "100%",
  },
  photoIndexTag: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  photoIndexText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "700",
  },
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.94)",
    justifyContent: "space-between",
    alignItems: "center",
  },
  lightboxHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 54 : 32,
    paddingBottom: 16,
    zIndex: 10,
  },
  lightboxCounter: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },
  lightboxCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  lightboxMain: {
    flex: 1,
    width: "100%",
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  lightboxImage: {
    width: "100%",
    height: "100%",
  },
  lightboxNavLeft: {
    position: "absolute",
    left: 16,
    zIndex: 10,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  lightboxNavRight: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  lightboxThumbnailsBar: {
    width: "100%",
    paddingVertical: 18,
    paddingHorizontal: 12,
  },
  lightboxThumb: {
    width: 52,
    height: 52,
    borderRadius: 8,
    marginHorizontal: 4,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  lightboxThumbSelected: {
    borderColor: colors.primary,
  },
  lightboxThumbImage: {
    width: "100%",
    height: "100%",
  },
});
