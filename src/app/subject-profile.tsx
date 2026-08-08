import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import Animated, {
    FadeInUp,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import { FeaturedNoteCard } from "../components/home/FeaturedNoteCard";
import { PaperCard } from "../components/library/PaperCard";
import { BookCard } from "../components/ui/BookCard";
import { SearchBar } from "../components/ui/SearchBar";
import { TrendingVideoCard } from "../components/ui/TrendingVideoCard";
import { colors, radius } from "../constants/theme";

type SubjectRecord = {
  id: string;
  name: string;
  avatar?: string;
  description?: string;
  accent?: string;
};

type ResourceItem = {
  id: string;
  type: "page" | "book" | "paper" | "lesson";
  title: string;
  description?: string;
  createdAt?: unknown;
  subject?: string;
  document?: string;
  image?: string;
  author?: string;
  teacher?: string;
  thumbnail?: string;
  link?: string;
  duration?: string;
  year?: string;
  pages?: string;
  data?: Record<string, unknown>;
};

type FilterTab = "All" | "Pages" | "Books" | "Past papers" | "Lessons";

const filterTabs: FilterTab[] = [
  "All",
  "Pages",
  "Books",
  "Past papers",
  "Lessons",
];
const defaultSubjectAvatar = require("../../assets/images/subject-default.png");

const normalizeKey = (value?: string) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const pickString = (value: unknown, fallback = "") => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
};

const pickArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => pickString(entry)).filter(Boolean);
  }
  const single = pickString(value);
  return single ? [single] : [];
};

const getCreatedAtValue = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  return 0;
};

function SubjectProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ subject?: string }>();
  const { width } = useWindowDimensions();
  const [subject, setSubject] = useState<SubjectRecord | null>(null);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectReady, setSubjectReady] = useState(false);
  const [resourcesReady, setResourcesReady] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [activeTab, setActiveTab] = useState<FilterTab>("All");
  const [visibleCount, setVisibleCount] = useState(6);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const requestIdRef = useRef(0);
  const scale = useSharedValue(1);

  const selectedSubject = pickString(params.subject, "").trim() || "Economics";
  const normalizedSubject = normalizeKey(selectedSubject);
  const accentColor = subject?.accent || colors.primary;
  const screenLoading = !subjectReady || !resourcesReady;
  const horizontalPadding = width >= 1024 ? 48 : width >= 768 ? 32 : 24;
  const contentMaxWidth = Math.min(860, width - horizontalPadding * 2);
  const sheetPaddingHorizontal = width >= 1024 ? 34 : width >= 768 ? 26 : 20;
  const defaultAvatarSource = subject?.avatar
    ? { uri: subject.avatar }
    : defaultSubjectAvatar;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const loadSubjectProfile = useCallback(async () => {
    setSubjectReady(false);
    if (!selectedSubject) {
      setSubjectReady(true);
      return;
    }

    const cacheKey = normalizeKey(selectedSubject);

    try {
      const snapshot = await getDocs(collection(db, "subject"));
      const match = snapshot.docs.find((doc) => {
        const data = doc.data() as Record<string, unknown>;
        return normalizeKey(pickString(data.name)) === cacheKey;
      });

      if (!match) {
        const fallback: SubjectRecord = {
          id: `${cacheKey}-fallback`,
          name: selectedSubject,
          avatar: "",
          description: "",
          accent: "",
        };
        setSubject(fallback);
        setSubjectReady(true);
        return;
      }

      const data = match.data() as Record<string, unknown>;
      const profile: SubjectRecord = {
        id: match.id,
        name: pickString(data.name, selectedSubject),
        avatar: pickString(data.avatar),
        description: pickString(data.description),
        accent: pickString(data.accent),
      };
      setSubject(profile);
      setSubjectReady(true);
    } catch (error) {
      console.error("Failed to load subject profile:", error);
      const fallback: SubjectRecord = {
        id: `${cacheKey}-fallback`,
        name: selectedSubject,
        avatar: "",
        description: "",
        accent: "",
      };
      setSubject(fallback);
      setSubjectReady(true);
    }
  }, [selectedSubject]);

  const loadResources = useCallback(async () => {
    if (!selectedSubject) return;
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setResourcesReady(false);
    setErrorMessage(null);

    try {
      const fetchPages = async () => {
        const snapshot = await getDocs(
          query(collection(db, "pages"), orderBy("createdAt", "desc")),
        );
        return snapshot.docs
          .map((doc) => ({
            id: doc.id,
            data: doc.data() as Record<string, unknown>,
          }))
          .filter((entry) => {
            const subjectValues = pickArray(entry.data.subject);
            return subjectValues.some(
              (value) => normalizeKey(value) === normalizedSubject,
            );
          })
          .map((entry) => {
            const data = entry.data as Record<string, unknown>;
            return {
              id: entry.id,
              type: "page" as const,
              title: pickString(data.title),
              description: pickString(data.description),
              createdAt: data.createdAt,
              subject: pickString(data.subject),
              document: pickString(data.document),
              image: pickString(data.image),
              author: pickString(data.author),
              data,
            } satisfies ResourceItem;
          });
      };

      const fetchBooks = async () => {
        const snapshot = await getDocs(
          query(collection(db, "books"), orderBy("createdAt", "desc")),
        );
        return snapshot.docs
          .map((doc) => ({
            id: doc.id,
            data: doc.data() as Record<string, unknown>,
          }))
          .filter((entry) => {
            const bookSubject = pickString(entry.data.subject);
            return normalizeKey(bookSubject) === normalizedSubject;
          })
          .map((entry) => {
            const data = entry.data as Record<string, unknown>;
            return {
              id: entry.id,
              type: "book" as const,
              title: pickString(data.title),
              description: pickString(data.description),
              createdAt: data.createdAt,
              subject: pickString(data.subject),
              image: pickString(data.image || data.cover || data.coverImage),
              author: pickString(data.author || data.writer),
            } satisfies ResourceItem;
          });
      };

      const fetchPapers = async () => {
        const snapshot = await getDocs(
          query(collection(db, "pastPaper"), orderBy("createdAt", "desc")),
        );
        return snapshot.docs
          .map((doc) => ({
            id: doc.id,
            data: doc.data() as Record<string, unknown>,
          }))
          .filter((entry) => {
            const paperSubject = pickString(entry.data.subject);
            return normalizeKey(paperSubject) === normalizedSubject;
          })
          .map((entry) => {
            const data = entry.data as Record<string, unknown>;
            return {
              id: entry.id,
              type: "paper" as const,
              title: pickString(data.title),
              description: pickString(data.description),
              createdAt: data.createdAt,
              subject: pickString(data.subject),
              document: pickString(data.document),
              image: pickString(data.image || data.cover || data.thumbnail),
              year: pickString(data.year),
              pages: pickString(data.pages),
            } satisfies ResourceItem;
          });
      };

      const fetchLessons = async () => {
        const snapshot = await getDocs(
          query(
            collection(db, "trendingLessons"),
            orderBy("createdAt", "desc"),
          ),
        );
        return snapshot.docs
          .map((doc) => ({
            id: doc.id,
            data: doc.data() as Record<string, unknown>,
          }))
          .filter((entry) => {
            const lessonSubject = pickString(entry.data.subject);
            return normalizeKey(lessonSubject) === normalizedSubject;
          })
          .map((entry) => {
            const data = entry.data as Record<string, unknown>;
            return {
              id: entry.id,
              type: "lesson" as const,
              title: pickString(data.title),
              description: pickString(data.description),
              createdAt: data.createdAt,
              subject: pickString(data.subject),
              teacher: pickString(data.teacher),
              thumbnail: pickString(data.thumbnail),
              link: pickString(data.link),
              duration: pickString(data.duration),
            } satisfies ResourceItem;
          });
      };

      let nextResources: ResourceItem[] = [];
      if (activeTab === "Books") {
        nextResources = await fetchBooks();
      } else if (activeTab === "Pages") {
        nextResources = await fetchPages();
      } else if (activeTab === "Past papers") {
        nextResources = await fetchPapers();
      } else if (activeTab === "Lessons") {
        nextResources = await fetchLessons();
      } else {
        const [pages, books, papers, lessons] = await Promise.all([
          fetchPages(),
          fetchBooks(),
          fetchPapers(),
          fetchLessons(),
        ]);
        nextResources = [...pages, ...books, ...papers, ...lessons].sort(
          (left, right) => {
            const leftValue = getCreatedAtValue(left.createdAt);
            const rightValue = getCreatedAtValue(right.createdAt);
            if (leftValue === rightValue) return 0;
            return Number(rightValue) - Number(leftValue);
          },
        );
      }

      if (requestId !== requestIdRef.current) return;
      setResources(nextResources);
      setVisibleCount(6);
      setErrorMessage(nextResources.length === 0 ? "" : null);
    } catch (error) {
      console.error("Failed to load subject resources:", error);
      if (requestId !== requestIdRef.current) return;
      setResources([]);
      setVisibleCount(6);
      setErrorMessage("");
    } finally {
      if (requestId === requestIdRef.current) {
        setResourcesReady(true);
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [activeTab, normalizedSubject, selectedSubject]);

  useEffect(() => {
    void loadSubjectProfile();
  }, [loadSubjectProfile]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => clearTimeout(timeout);
  }, [search]);

  const filteredResources = useMemo(() => {
    const query = debouncedSearch.toLowerCase();
    const scoped = resources.filter((item) => {
      if (activeTab === "All") return true;
      if (activeTab === "Pages") return item.type === "page";
      if (activeTab === "Books") return item.type === "book";
      if (activeTab === "Past papers") return item.type === "paper";
      if (activeTab === "Lessons") return item.type === "lesson";
      return true;
    });

    if (!query || query.length < 2) return scoped;

    return scoped.filter((item) => {
      const haystack = [
        item.title,
        item.description,
        item.subject,
        item.author,
        item.teacher,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [activeTab, debouncedSearch, resources]);

  const visibleResources = useMemo(() => {
    return filteredResources.slice(0, visibleCount);
  }, [filteredResources, visibleCount]);

  const hasMore = visibleCount < filteredResources.length;

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    void loadResources();
  }, [loadResources]);

  const renderResource = (item: ResourceItem) => {
    if (item.type === "page") {
      const note = {
        id: item.id,
        title: item.title,
        description: item.description,
        subject: item.subject,
        document: item.document,
        createdAt: item.createdAt,
        author: item.author,
      };
      return (
        <View key={item.id} style={styles.resourceBlock}>
          <FeaturedNoteCard
            notes={[note as any]}
            source="pages"
            hideAvatar
            loading={false}
          />
        </View>
      );
    }

    if (item.type === "book") {
      const bookItem = {
        id: item.id,
        title: item.title,
        description: item.description || "",
        author: item.author || "",
        rating: "4.8 ★",
        subject: item.subject || selectedSubject,
        image: item.image || "",
        badge: "New",
      };
      return (
        <View key={item.id} style={styles.resourceBlock}>
          <BookCard
            item={bookItem as any}
            index={0}
            scrollX={{ value: 0 } as any}
          />
        </View>
      );
    }

    if (item.type === "paper") {
      return (
        <View key={item.id} style={styles.resourceBlock}>
          <PaperCard
            title={item.title}
            subject={item.subject || selectedSubject}
            year={item.year || ""}
            pages={item.pages || ""}
            image={item.image || ""}
            document={item.document}
          />
        </View>
      );
    }

    return (
      <View key={item.id} style={styles.resourceBlock}>
        <TrendingVideoCard
          item={{
            id: item.id,
            title: item.title,
            subject: item.subject || selectedSubject,
            teacher: item.teacher || "",
            uploadedAt: "",
            duration: item.duration || "",
            thumbnail: item.thumbnail || "",
            link: item.link || "",
          }}
          width={Math.min(320, width - 56)}
        />
      </View>
    );
  };

  const emptyState = () => {
    return null;
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View
        style={[
          styles.container,
          { maxWidth: contentMaxWidth, paddingHorizontal: horizontalPadding },
        ]}
      >
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={accentColor}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View
              style={[styles.heroOverlay, { backgroundColor: accentColor }]}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => {
                setSubject(null);
                setResources([]);
                setSearch("");
                setDebouncedSearch("");
                setVisibleCount(6);
                setErrorMessage("");
                setResourcesReady(false);
                setSubjectReady(false);
                setLoading(true);
                router.back();
              }}
              onPressIn={() => {
                scale.value = withSpring(0.94);
              }}
              onPressOut={() => {
                scale.value = withSpring(1);
              }}
              style={styles.backButton}
            >
              <Animated.View style={animatedStyle}>
                <View style={styles.backButtonInner}>
                  <Icon name="arrow-left" size={20} color="#FFFFFF" />
                </View>
              </Animated.View>
            </Pressable>
          </View>

          <View
            style={[
              styles.sheet,
              { paddingHorizontal: sheetPaddingHorizontal },
            ]}
          >
            <Animated.View
              entering={FadeInUp.duration(450)}
              style={styles.avatarWrap}
            >
              <Image
                source={defaultAvatarSource}
                style={[styles.avatar, { borderColor: accentColor }]}
                contentFit="cover"
                onError={() => {
                  if (subject?.avatar) {
                    setSubject((current) =>
                      current ? { ...current, avatar: "" } : current,
                    );
                  }
                }}
              />
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(520)}
              style={styles.headerCopy}
            >
              <Text style={[styles.subjectTitle, { color: accentColor }]}>
                {subject?.name || selectedSubject}
              </Text>
              <Text
                style={[styles.subjectDescription, { color: accentColor }]}
                numberOfLines={4}
              >
                {subject?.description || ""}
              </Text>
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(560)}
              style={styles.filterRow}
            >
              {filterTabs.map((tab) => {
                const active = tab === activeTab;
                return (
                  <Pressable
                    key={tab}
                    accessibilityRole="button"
                    style={[
                      styles.filterChip,
                      active && { backgroundColor: accentColor },
                    ]}
                    onPress={() => {
                      setActiveTab(tab);
                      setSearch("");
                      setDebouncedSearch("");
                    }}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        active
                          ? styles.filterChipTextActive
                          : styles.filterChipTextInactive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </Pressable>
                );
              })}
            </Animated.View>

            <Animated.View
              entering={FadeInUp.duration(620)}
              style={styles.resourcesSection}
            >
              <Text style={styles.resourcesTitle}>Resources</Text>
              <SearchBar
                isInput
                value={search}
                onChangeText={setSearch}
                onClear={() => setSearch("")}
                placeholder={`Search in ${subject?.name || selectedSubject}`}
                containerStyle={styles.searchBarContainer}
                inputContainerStyle={styles.searchBarInputContainer}
                inputStyle={styles.searchBarInput}
                placeholderTextColor="#9AA8BF"
                searchIconColor={accentColor}
              />
              <Text style={styles.itemsCount}>
                Items ({filteredResources.length})
              </Text>
            </Animated.View>

            {screenLoading ? (
              <Animated.View
                entering={FadeInUp.duration(650)}
                style={styles.skeletonWrap}
              >
                <View style={styles.skeletonCard} />
                <View style={styles.skeletonCardShort} />
              </Animated.View>
            ) : errorMessage && filteredResources.length === 0 ? (
              emptyState()
            ) : (
              <Animated.View
                entering={FadeInUp.duration(680)}
                style={styles.resourceList}
              >
                {visibleResources.map((item) => renderResource(item))}
                {hasMore && (
                  <Pressable
                    style={styles.loadMoreButton}
                    onPress={() => setVisibleCount((current) => current + 4)}
                  >
                    <Text style={styles.loadMoreText}>Load more</Text>
                  </Pressable>
                )}
              </Animated.View>
            )}
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.white,
  },
  container: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
  },
  hero: {
    height: 168,
    backgroundColor: colors.white,
    position: "relative",
    overflow: "hidden",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
  },
  backButton: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 2,
  },
  backButtonInner: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  contentScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 36,
  },
  sheet: {
    width: "100%",
    marginTop: -36,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 72,
    paddingBottom: 24,
    backgroundColor: colors.white,
  },
  avatarWrap: {
    alignItems: "center",
    marginTop: -140,
  },
  avatar: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 5,
    borderColor: colors.white,
  },
  headerCopy: {
    alignItems: "center",
    marginTop: 12,
    paddingHorizontal: 8,
  },
  subjectTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  subjectDescription: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F3F6FB",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  filterChipTextActive: {
    color: colors.white,
  },
  filterChipTextInactive: {
    color: "#9AA8BF",
  },
  resourcesSection: {
    marginTop: 6,
  },
  resourcesTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 10,
  },
  searchBarContainer: {
    marginBottom: 8,
  },
  searchBarInputContainer: {
    borderColor: "#EAEEF6",
    borderRadius: 16,
    backgroundColor: colors.white,
  },
  searchBarInput: {
    fontSize: 13,
    color: colors.text,
  },
  itemsCount: {
    fontSize: 11,
    color: "#6F7A8F",
    marginBottom: 12,
  },
  skeletonWrap: {
    gap: 12,
    marginTop: 8,
  },
  skeletonCard: {
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: "#F0F3F8",
  },
  skeletonCardShort: {
    height: 110,
    borderRadius: radius.md,
    backgroundColor: "#F6F8FC",
  },
  resourceList: {
    gap: 14,
  },
  resourceBlock: {
    width: "100%",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: "#F9FBFF",
  },
  emptyTitle: {
    marginTop: 10,
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: "#6F7A8F",
    textAlign: "center",
  },
  loadMoreButton: {
    alignSelf: "center",
    marginTop: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: colors.lightBackground,
  },
  loadMoreText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});

export default SubjectProfileScreen;
