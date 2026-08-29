import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { auth, db } from "../../firebaseConfig";
import { getHorizontalPadding } from "../constants/layout";
import { colors, radius, spacing } from "../constants/theme";
import { PaperItem, useLibraryData } from "../hooks/useLibraryData";
import {
  TrendingLesson,
  useTrendingLessons,
} from "../hooks/useTrendingLessons";
import { recordUserActivity } from "../services/activityService";
import { resolveVideoImageSource } from "../utils/videoUtils";

type Book = { id: string; title: string; author: string; image: string };
type ViewMode = "books" | "courses" | "papers";

const getBookText = (value: unknown, fallback: string): string => {
  if (Array.isArray(value) && value.length > 0) {
    return getBookText(value[0], fallback);
  }

  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

export default function SeeAllScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);
  const params = useLocalSearchParams<{
    type?: string;
    paperType?: string;
    paperYear?: string;
  }>();
  const mode: ViewMode =
    params.type === "courses" || params.type === "papers"
      ? params.type
      : "books";
  const columns = width >= 700 ? 3 : width >= 430 ? 2 : 1;
  const { paperCollections, loading: papersLoading } = useLibraryData();
  const {
    lessons,
    loading: coursesLoading,
    error: coursesError,
  } = useTrendingLessons();
  const [books, setBooks] = useState<Book[]>([]);
  const [booksLoading, setBooksLoading] = useState(mode === "books");

  useEffect(() => {
    if (mode !== "books") return;
    let mounted = true;
    void getDocs(collection(db, "books"))
      .then((snapshot) => {
        if (!mounted) return;
        setBooks(
          snapshot.docs.map((doc, index) => {
            const data = doc.data() as Record<string, unknown>;
            return {
              id: doc.id || `book-${index}`,
              title: getBookText(
                data.title || data.name || data.bookTitle,
                "Untitled book",
              ),
              author: getBookText(
                data.author || data.writer || data.publisher,
                "Unknown author",
              ),
              image: getBookText(
                data.image || data.coverImage || data.cover || data.thumbnail,
                "",
              ),
            };
          }),
        );
        setBooksLoading(false);
      })
      .catch(() => {
        if (mounted) setBooksLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [mode]);

  const papers = useMemo(() => {
    const requestedType = params.paperType?.trim().toLowerCase();
    const requestedYear = params.paperYear?.trim();

    return paperCollections
      .filter((section) => {
        const matchesType =
          !requestedType || section.type.trim().toLowerCase() === requestedType;
        const matchesYear =
          !requestedYear || section.year.trim() === requestedYear;
        return matchesType && matchesYear;
      })
      .flatMap((section) => section.items);
  }, [paperCollections, params.paperType, params.paperYear]);

  const title =
    mode === "courses"
      ? "Trending Lessons"
      : mode === "papers"
        ? (() => {
            const typePart = params.paperType?.trim()
              ? `${params.paperType.trim().toUpperCase()} `
              : "";
            const yearPart = params.paperYear?.trim()
              ? params.paperYear.trim()
              : "";
            return yearPart
              ? `${typePart}${yearPart}`
              : `${typePart}Past Papers`;
          })()
        : "Books";
  const data = mode === "books" ? books : mode === "courses" ? lessons : papers;
  const loading =
    mode === "books"
      ? booksLoading
      : mode === "courses"
        ? coursesLoading
        : papersLoading;

  return (
    <View style={styles.screen}>
      <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
          >
            <Feather name="chevron-left" size={22} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.eyebrow}>Explore library</Text>
            <Text style={styles.heading}>{title}</Text>
          </View>
        </View>
        {loading ? (
          <View style={styles.state}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.stateText}>
              Loading {title.toLowerCase()}...
            </Text>
          </View>
        ) : data.length === 0 || (mode === "courses" && coursesError) ? (
          <View style={styles.state}>
            <Text style={styles.stateTitle}>Nothing here yet</Text>
            <Text style={styles.stateText}>
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
                    onPress={() =>
                      router.push({
                        pathname: "/lesson-player",
                        params: {
                          title: item.title,
                          teacher: item.teacher,
                          subject: item.subject,
                          duration: item.duration,
                          link: item.link,
                          thumbnail: item.thumbnail,
                        },
                      } as any)
                    }
                  />
                ) : (
                  <PaperTile
                    item={item}
                    onPress={() =>
                      item.document &&
                      router.push({
                        pathname: "/pdf-reader",
                        params: {
                          uri: encodeURIComponent(item.document),
                          title: item.title,
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
  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
    >
      <Image source={item.image} style={styles.bookImage} contentFit="cover" />
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.cardMeta} numberOfLines={1}>
        {item.author}
      </Text>
    </Pressable>
  );
}

function CourseTile({
  item,
  onPress,
}: {
  item: TrendingLesson;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open lesson: ${item.title}`}
    >
      <View style={styles.courseImageWrap}>
        <Image
          source={resolveVideoImageSource(item.thumbnail, item.link)}
          style={styles.courseImage}
          contentFit="cover"
        />
        <View style={styles.play}>
          <Feather name="play" size={16} color={colors.white} />
        </View>
        <Text style={styles.duration}>{item.duration}</Text>
      </View>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.cardMeta} numberOfLines={1}>
        {item.teacher}
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
  return (
    <Pressable
      style={styles.card}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Open ${item.title}`}
    >
      <Image source={item.image} style={styles.paperImage} contentFit="cover" />
      <Text style={styles.subject}>{item.subject}</Text>
      <Text style={styles.cardTitle} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={styles.cardMeta}>
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
});
