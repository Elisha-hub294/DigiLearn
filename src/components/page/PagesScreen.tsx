import { Feather as Icon } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  DocumentSnapshot,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInDown,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../../firebaseConfig";
import { getHorizontalPadding } from "../../constants/layout";
import { colors, radius, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import {
  getHiddenPageEntries,
  getMarkedReadItemIds,
} from "../../services/userProfile";
import { matchesUserInterests } from "../../utils/interestFilter";
import { FeaturedNoteCard } from "../home/FeaturedNoteCard";
import { NotifyToggle } from "../library/add-item/SharedFormControls";
import { SearchBar } from "../ui/SearchBar";

type PageNote = {
  id: string;
  title?: string;
  description?: string;
  subject?: string | string[];
  book?: string | string[];
  createdAt?: unknown;
  updatedAt?: unknown;
  level?: string;
  schoolClass?: string;
  cover?: string;
  visits?: number;
  readStatus?: string;
  isRead?: boolean;
  progress?: number;
  document?: string;
};

type FilterState = {
  sortBy: string;
  readingStatus: string;
  level: string;
  schoolClass: string;
  attachments: string;
};

type PageViewOptions = {
  showHiddenItems: boolean;
  followPreferences: boolean;
};

const DEFAULT_VIEW_OPTIONS: PageViewOptions = {
  showHiddenItems: false,
  followPreferences: false,
};

const DEFAULT_FILTERS: FilterState = {
  sortBy: "Newest",
  readingStatus: "All",
  level: "All",
  schoolClass: "All",
  attachments: "All",
};

const FILTER_OPTIONS = {
  sortBy: [
    "Newest",
    "Oldest",
    "Most Read",
    "Recently Updated",
    "Alphabetical (A–Z)",
  ],
  readingStatus: ["All", "Unread", "Read", "Continue Reading"],
  attachments: ["All", "With Books", "Without Books"],
} as const;

const PAGE_BATCH_SIZE = 20;

const normalizeText = (value?: string) => value?.trim().toLowerCase() ?? "";
const normalizeArray = (value: unknown): string[] => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .filter(
        (item): item is string =>
          typeof item === "string" && item.trim().length > 0,
      )
      .map((item) => item.trim().toLowerCase());
  }
  if (typeof value === "string" && value.trim()) {
    return [value.trim().toLowerCase()];
  }
  return [];
};

const extractAccentColor = (rawAccent: unknown): string => {
  if (!rawAccent) return "#000000";

  if (typeof rawAccent === "string" && rawAccent.trim()) {
    const trimmed = rawAccent.trim();

    if (trimmed.startsWith("#") || trimmed.startsWith("rgb")) {
      return trimmed;
    }

    if (trimmed.toLowerCase() === "black") {
      return "#000000";
    }

    if (/^[0-9A-Fa-f]{3}$/.test(trimmed) || /^[0-9A-Fa-f]{6}$/.test(trimmed)) {
      return `#${trimmed}`;
    }

    return trimmed;
  }

  if (typeof rawAccent === "object" && rawAccent !== null) {
    const accentObject = rawAccent as Record<string, unknown>;

    if (typeof accentObject.color === "string" && accentObject.color.trim()) {
      return accentObject.color.trim();
    }

    if (typeof accentObject.hex === "string" && accentObject.hex.trim()) {
      return accentObject.hex.trim();
    }
  }

  return "#000000";
};

const formatCreatedAt = (value: unknown) => {
  if (!value) return 0;
  if (typeof value === "object" && value && "seconds" in value) {
    const seconds = Number((value as { seconds?: number }).seconds ?? 0);
    return seconds * 1000;
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number") {
    const num = Number(value);
    if (!Number.isNaN(num)) return num;
  }
  return 0;
};

const sortNotes = (notes: PageNote[], sortBy: string) => {
  const list = [...notes];
  const noteDate = (note: PageNote) =>
    formatCreatedAt(note.createdAt ?? note.updatedAt);

  switch (sortBy) {
    case "Oldest":
      return list.sort((a, b) => noteDate(a) - noteDate(b));
    case "Most Read":
      return list.sort(
        (a, b) => (Number(b.visits ?? 0) || 0) - (Number(a.visits ?? 0) || 0),
      );
    case "Recently Updated":
      return list.sort(
        (a, b) => formatCreatedAt(b.updatedAt) - formatCreatedAt(a.updatedAt),
      );
    case "Alphabetical (A–Z)":
      return list.sort((a, b) =>
        (a.title ?? "").localeCompare(b.title ?? "", undefined, {
          sensitivity: "base",
        }),
      );
    case "Newest":
    default:
      return list.sort((a, b) => noteDate(b) - noteDate(a));
  }
};

const filterByReadStatus = (
  note: PageNote,
  readingStatus: string,
  readNoteIds: ReadonlySet<string>,
) => {
  if (readingStatus === "All") return true;
  const isRead = readNoteIds.has(note.id);
  const inProgress = Number(note.progress ?? 0) > 0;

  switch (readingStatus) {
    case "Unread":
      return !isRead && !inProgress;
    case "Read":
      return isRead;
    case "Continue Reading":
      return inProgress && !isRead;
    default:
      return true;
  }
};

const filterByLevel = (note: PageNote, level: string) => {
  if (level === "All") return true;
  return normalizeText(note.level) === normalizeText(level);
};

const filterByClass = (note: PageNote, schoolClass: string) => {
  if (schoolClass === "All") return true;
  return normalizeText(note.schoolClass) === normalizeText(schoolClass);
};

const filterByAttachments = (note: PageNote, attachments: string) => {
  if (attachments === "All") return true;
  const hasBooks = normalizeArray(note.book).length > 0;
  return attachments === "With Books" ? hasBooks : !hasBooks;
};

export default function PagesScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const params = useLocalSearchParams<{ title?: string }>();
  const pageTitle = typeof params.title === "string" ? params.title : "Pages";
  const [notes, setNotes] = useState<PageNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [viewOptions, setViewOptions] =
    useState<PageViewOptions>(DEFAULT_VIEW_OPTIONS);
  const [isLoadedFilters, setIsLoadedFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [subjectAccent, setSubjectAccent] = useState("#000000");
  const [hasMoreNotes, setHasMoreNotes] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const lastPageDocument = useRef<DocumentSnapshot | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1080, width - horizontalPadding * 2);

  const activeFilterCount = useMemo(() => {
    const chipCount = Object.values(filters).filter(
      (option) => option !== "All" && option !== "Newest",
    ).length;
    const optionCount = Object.values(viewOptions).filter(Boolean).length;
    return chipCount + optionCount;
  }, [filters, viewOptions]);
  const readNoteIds = useMemo(
    () => new Set(getMarkedReadItemIds(profile)),
    [profile],
  );
  const hiddenNoteIds = useMemo(
    () => new Set(getHiddenPageEntries(profile).map((entry) => entry.id)),
    [profile],
  );

  const isPageDataReady = !loading;

  useEffect(() => {
    let cancelled = false;

    const hydratePageData = async () => {
      try {
        setLoading(true);

        lastPageDocument.current = null;
        setHasMoreNotes(true);
        const [subjectsSnapshot, pagesSnapshot] = await Promise.all([
          getDocs(collection(db, "subject")),
          getDocs(
            query(
              collection(db, "pages"),
              orderBy("updatedAt", "desc"),
              limit(PAGE_BATCH_SIZE),
            ),
          ),
        ]);

        if (cancelled) return;

        const matchedSubject = subjectsSnapshot.docs.find((subjectDoc) => {
          const subjectData = subjectDoc.data() as { name?: unknown };
          return (
            normalizeText(
              typeof subjectData.name === "string"
                ? subjectData.name
                : undefined,
            ) === normalizeText(pageTitle)
          );
        });

        const accent = matchedSubject
          ? extractAccentColor(
              (matchedSubject.data() as { accent?: unknown }).accent,
            )
          : "#000000";

        lastPageDocument.current =
          pagesSnapshot.docs[pagesSnapshot.docs.length - 1] ?? null;
        setHasMoreNotes(pagesSnapshot.size === PAGE_BATCH_SIZE);

        const allNotes = pagesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Record<string, unknown>),
        })) as PageNote[];

        const topicNotes = allNotes.filter((note) => {
          const noteSubjects = normalizeArray(note.subject);
          return noteSubjects.includes(normalizeText(pageTitle));
        });

        setNotes(topicNotes);
        setSubjectAccent(accent);
      } catch (error) {
        console.error("Failed to load pages screen data", error);
        setNotes([]);
        setSubjectAccent("#000000");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void hydratePageData();

    return () => {
      cancelled = true;
    };
  }, [pageTitle]);

  const loadMoreNotes = async () => {
    if (loadingMore || !hasMoreNotes || !lastPageDocument.current) return;

    try {
      setLoadingMore(true);
      const pagesSnapshot = await getDocs(
        query(
          collection(db, "pages"),
          orderBy("updatedAt", "desc"),
          startAfter(lastPageDocument.current),
          limit(PAGE_BATCH_SIZE),
        ),
      );
      lastPageDocument.current =
        pagesSnapshot.docs[pagesSnapshot.docs.length - 1] ??
        lastPageDocument.current;
      setHasMoreNotes(pagesSnapshot.size === PAGE_BATCH_SIZE);

      const nextNotes = pagesSnapshot.docs
        .map(
          (doc) =>
            ({
              id: doc.id,
              ...(doc.data() as Record<string, unknown>),
            }) as PageNote,
        )
        .filter((note) =>
          normalizeArray(note.subject).includes(normalizeText(pageTitle)),
        );
      setNotes((current) => [...current, ...nextNotes]);
    } catch (error) {
      console.error("Failed to load more pages", error);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const loadPersistedFilters = async () => {
      try {
        const saved = await AsyncStorage.getItem(
          `digilearn-pages-filters:${pageTitle}`,
        );
        if (saved) {
          const parsed = JSON.parse(saved) as FilterState & PageViewOptions;
          const restored = { ...DEFAULT_FILTERS, ...parsed };
          setFilters({
            ...restored,
            sortBy:
              restored.sortBy === "Most Progress"
                ? DEFAULT_FILTERS.sortBy
                : restored.sortBy,
            level: ["Primary", "O level", "A level"].includes(restored.level)
              ? DEFAULT_FILTERS.level
              : restored.level,
          });
          setViewOptions({
            showHiddenItems: Boolean(parsed.showHiddenItems),
            followPreferences: Boolean(parsed.followPreferences),
          });
        }
      } catch (error) {
        console.error("Failed to load persisted page filters", error);
      } finally {
        setIsLoadedFilters(true);
      }
    };

    loadPersistedFilters();
  }, [pageTitle]);

  useEffect(() => {
    if (!isLoadedFilters) return;
    AsyncStorage.setItem(
      `digilearn-pages-filters:${pageTitle}`,
      JSON.stringify({ ...filters, ...viewOptions }),
    ).catch((error) => {
      console.error("Failed to save page filters", error);
    });
  }, [filters, isLoadedFilters, pageTitle, viewOptions]);

  const visibleNotes = useMemo(() => {
    let filtered = [...notes];

    if (!viewOptions.showHiddenItems) {
      filtered = filtered.filter((note) => !hiddenNoteIds.has(note.id));
    }

    if (viewOptions.followPreferences) {
      filtered = filtered.filter((note) =>
        matchesUserInterests(note.subject, profile?.subjects),
      );
    }

    if (searchQuery.trim().length >= 2) {
      const query = searchQuery.trim().toLowerCase();
      filtered = filtered.filter((note) => {
        const title = normalizeText(note.title);
        const description = normalizeText(note.description);
        const books = normalizeArray(note.book).join(" ");
        return (
          title.includes(query) ||
          description.includes(query) ||
          books.includes(query)
        );
      });
    }

    filtered = filtered.filter((note) =>
      filterByReadStatus(note, filters.readingStatus, readNoteIds),
    );
    filtered = filtered.filter((note) => filterByLevel(note, filters.level));
    filtered = filtered.filter((note) =>
      filterByClass(note, filters.schoolClass),
    );
    filtered = filtered.filter((note) =>
      filterByAttachments(note, filters.attachments),
    );

    return sortNotes(filtered, filters.sortBy);
  }, [
    filters,
    hiddenNoteIds,
    notes,
    profile?.subjects,
    readNoteIds,
    searchQuery,
    viewOptions,
  ]);

  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    searchTimeout.current = setTimeout(() => {
      setSearchQuery(searchText.trim());
    }, 300);

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchText]);

  const resetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setViewOptions(DEFAULT_VIEW_OPTIONS);
    setSearchText("");
    setShowFilters(false);
  };

  const applyFilters = () => {
    setShowFilters(false);
  };

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const updateViewOption = (key: keyof PageViewOptions, value: boolean) => {
    setViewOptions((current) => ({ ...current, [key]: value }));
  };

  const filterOptions = useMemo(() => {
    const uniqueValues = (key: "level" | "schoolClass") => [
      "All",
      ...Array.from(
        new Set(
          notes
            .map((note) => note[key]?.trim())
            .filter((value): value is string => Boolean(value)),
        ),
      ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" })),
    ];

    return {
      ...FILTER_OPTIONS,
      level: uniqueValues("level"),
      schoolClass: uniqueValues("schoolClass"),
    };
  }, [notes]);

  const renderFilterOptions = (key: keyof FilterState) => {
    const options = filterOptions[key] ?? [];
    return options.map((option) => {
      const isSelected = filters[key] === option;
      return (
        <Pressable
          key={option}
          onPress={() => updateFilter(key, option)}
          style={[
            styles.filterOption,
            isSelected && { backgroundColor: subjectAccent },
          ]}
        >
          <Text
            style={[
              styles.filterOptionText,
              isSelected && styles.filterOptionTextSelected,
            ]}
          >
            {option}
          </Text>
        </Pressable>
      );
    });
  };

  if (!isPageDataReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.skeletonPage}>
          <View
            style={[
              styles.skeletonInner,
              {
                maxWidth: contentMaxWidth,
                paddingHorizontal: horizontalPadding,
              },
            ]}
          >
            <View style={styles.skeletonHeaderRow}>
              <View style={styles.skeletonBackButton} />
              <View style={styles.skeletonHeaderTitle} />
            </View>
            <View style={styles.skeletonSearchSection}>
              <View style={styles.skeletonSearchRow} />
              <View style={styles.skeletonFilterButton} />
            </View>
            <View style={styles.skeletonListSection}>
              <View style={styles.skeletonItemsCount} />
              <View style={styles.skeletonCard}>
                <View style={styles.skeletonPreview} />
                <View style={styles.skeletonCardContent}>
                  <View style={styles.skeletonAvatar} />
                  <View style={styles.skeletonCardCopy}>
                    <View style={styles.skeletonCardTitle} />
                    <View style={styles.skeletonCardDescription} />
                    <View style={styles.skeletonCardDescriptionShort} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View entering={FadeInUp.duration(420)} style={styles.page}>
        <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
          <View
            style={[styles.headerRow, { paddingHorizontal: horizontalPadding }]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Icon name="chevron-left" size={26} color="#111111" />
            </Pressable>

            <Text style={[styles.pageTitle, { color: subjectAccent }]}>
              {pageTitle}
            </Text>
          </View>

          <View
            style={[
              styles.searchSection,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            <View style={styles.searchBarWrap}>
              <SearchBar
                value={searchText}
                placeholder={`Search in ${pageTitle}`}
                accessibilityLabel={`Search within ${pageTitle}`}
                onChangeText={setSearchText}
                onClear={() => setSearchText("")}
                isInput
                variant="topic"
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open filters"
              onPress={() => setShowFilters(true)}
              style={[styles.filterButton, { backgroundColor: subjectAccent }]}
            >
              <Icon name="sliders" size={18} color="#FFFFFF" />
              {activeFilterCount > 0 && <View style={styles.badge} />}
            </Pressable>
          </View>

          <View
            style={[
              styles.listSection,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            {!isPageDataReady ? (
              <FeaturedNoteCard loading={true} />
            ) : visibleNotes.length === 0 ? (
              <Animated.View
                entering={FadeIn.duration(240)}
                style={styles.emptyState}
              >
                <Text style={[styles.emptyTitle, { color: subjectAccent }]}>
                  No matching notes found
                </Text>
                <Text style={styles.emptySubtitle}>
                  Try a different keyword or adjust your filters.
                </Text>
                <Pressable
                  onPress={resetFilters}
                  style={[
                    styles.emptyButton,
                    { backgroundColor: subjectAccent },
                  ]}
                >
                  <Text style={styles.emptyButtonText}>Clear Filters</Text>
                </Pressable>
                {hasMoreNotes && (
                  <Pressable
                    onPress={loadMoreNotes}
                    disabled={loadingMore}
                    style={styles.loadMoreEmptyButton}
                  >
                    <Text style={styles.loadMoreEmptyText}>
                      {loadingMore ? "Loading..." : "Load more resources"}
                    </Text>
                  </Pressable>
                )}
              </Animated.View>
            ) : (
              <Animated.View
                entering={FadeIn.duration(260)}
                style={styles.notesWrap}
              >
                <Text style={styles.itemsCount}>
                  {visibleNotes.length} items
                </Text>
                <FeaturedNoteCard
                  subject={pageTitle}
                  notes={visibleNotes.map((note) => ({
                    ...note,
                    subject:
                      Array.isArray(note.subject) && note.subject.length > 0
                        ? note.subject[0]
                        : note.subject,
                    book:
                      Array.isArray(note.book) && note.book.length > 0
                        ? note.book[0]
                        : note.book,
                  }))}
                  loading={false}
                  source="pages"
                  includeHiddenItems={viewOptions.showHiddenItems}
                  filterByInterests={viewOptions.followPreferences}
                  onEndReached={loadMoreNotes}
                  loadingMore={loadingMore}
                  hasMore={hasMoreNotes}
                />
              </Animated.View>
            )}
          </View>
        </View>

        <Modal
          transparent
          visible={showFilters}
          animationType="slide"
          onRequestClose={() => setShowFilters(false)}
        >
          <Animated.View
            entering={FadeIn.duration(180)}
            style={styles.modalBackdrop}
          >
            <Pressable
              style={styles.backdropPress}
              onPress={() => setShowFilters(false)}
            />
            <Animated.View
              entering={SlideInDown.duration(280)}
              style={styles.sheet}
            >
              <View style={styles.handle} />
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.sheetContent}
              >
                <Text style={styles.sheetTitle}>Filter notes</Text>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Sort By</Text>
                  <View style={styles.filterOptionGrid}>
                    {renderFilterOptions("sortBy")}
                  </View>
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Reading Status</Text>
                  <View style={styles.filterOptionGrid}>
                    {renderFilterOptions("readingStatus")}
                  </View>
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Level</Text>
                  <View style={styles.filterOptionGrid}>
                    {renderFilterOptions("level")}
                  </View>
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Class</Text>
                  <View style={styles.filterOptionGrid}>
                    {renderFilterOptions("schoolClass")}
                  </View>
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>Attachments</Text>
                  <View style={styles.filterOptionGrid}>
                    {renderFilterOptions("attachments")}
                  </View>
                </View>

                <View style={styles.filterGroup}>
                  <Text style={styles.filterLabel}>More resources</Text>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleCopy}>
                      <Text style={styles.toggleTitle}>Show hidden items</Text>
                      <Text style={styles.toggleSubtitle}>
                        Include pages you previously hid.
                      </Text>
                    </View>
                    <NotifyToggle
                      checked={viewOptions.showHiddenItems}
                      onToggle={() =>
                        updateViewOption(
                          "showHiddenItems",
                          !viewOptions.showHiddenItems,
                        )
                      }
                      accessibilityLabel="Show hidden items"
                    />
                  </View>
                  <View style={styles.toggleRow}>
                    <View style={styles.toggleCopy}>
                      <Text style={styles.toggleTitle}>
                        Follow set preferences
                      </Text>
                      <Text style={styles.toggleSubtitle}>
                        Only show resources matching your selected subjects.
                      </Text>
                    </View>
                    <NotifyToggle
                      checked={viewOptions.followPreferences}
                      onToggle={() =>
                        updateViewOption(
                          "followPreferences",
                          !viewOptions.followPreferences,
                        )
                      }
                      accessibilityLabel="Follow set preferences"
                    />
                  </View>
                </View>

                <View style={styles.sheetActions}>
                  <Pressable
                    onPress={resetFilters}
                    style={styles.secondaryAction}
                  >
                    <Text
                      style={[
                        styles.secondaryActionText,
                        { color: subjectAccent },
                      ]}
                    >
                      Reset Filters
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={applyFilters}
                    style={[
                      styles.primaryAction,
                      { backgroundColor: subjectAccent },
                    ]}
                  >
                    <Text style={styles.primaryActionText}>Apply</Text>
                  </Pressable>
                </View>
              </ScrollView>
            </Animated.View>
          </Animated.View>
        </Modal>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  page: {
    flex: 1,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  skeletonPage: {
    flex: 1,
    alignItems: "center",
    paddingTop: spacing.xl,
    backgroundColor: colors.white,
  },
  skeletonInner: {
    width: "100%",
  },
  skeletonHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 40,
    marginTop: spacing.md,
    marginBottom: 28,
  },
  skeletonBackButton: {
    width: 40,
    height: 40,
    marginRight: spacing.md,
    borderRadius: 20,
    backgroundColor: "#ECEFF3",
  },
  skeletonHeaderTitle: {
    width: 180,
    height: 34,
    borderRadius: 8,
    backgroundColor: "#ECEFF3",
  },
  skeletonSearchSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  skeletonSearchRow: {
    flex: 1,
    height: 88,
    marginRight: spacing.md,
    borderRadius: 28,
    backgroundColor: "#F1F3F5",
  },
  skeletonFilterButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#ECEFF3",
  },
  skeletonListSection: {
    flex: 1,
  },
  skeletonItemsCount: {
    width: 72,
    height: 17,
    marginBottom: spacing.md,
    borderRadius: 6,
    backgroundColor: "#ECEFF3",
  },
  skeletonCard: {
    width: "100%",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  skeletonPreview: {
    width: "100%",
    height: 320,
    borderRadius: 10,
    backgroundColor: "#F1F3F5",
    marginBottom: spacing.sm,
  },
  skeletonCardContent: {
    flexDirection: "row",
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  skeletonAvatar: {
    width: 42,
    height: 42,
    marginRight: spacing.sm,
    borderRadius: 21,
    backgroundColor: "#E8EDF0",
  },
  skeletonCardCopy: {
    flex: 1,
  },
  skeletonCardTitle: {
    width: "60%",
    height: 16,
    marginBottom: 8,
    borderRadius: 6,
    backgroundColor: "#EFEFEF",
  },
  skeletonCardDescription: {
    width: "90%",
    height: 12,
    marginBottom: 6,
    borderRadius: 6,
    backgroundColor: "#EFEFEF",
  },
  skeletonCardDescriptionShort: {
    width: "40%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EFEFEF",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
    alignItems: "stretch",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: 28,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  pageTitle: {
    fontSize: 34,
    fontWeight: "700",
    color: "#111111",
    flexShrink: 1,
  },
  searchSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  searchBarWrap: {
    flex: 1,
    marginRight: spacing.md,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 6,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: "#ff0000",
    borderWidth: 2,
    borderColor: colors.white,
  },
  listSection: {
    flex: 1,
  },
  itemsCount: {
    fontSize: 14,
    color: colors.subtitle,
    marginBottom: spacing.md,
  },
  notesWrap: {
    width: "100%",
  },
  emptyState: {
    paddingVertical: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.lg,
    backgroundColor: "#F8F9FB",
  },
  emptyTitle: {
    color: "#111111",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    color: colors.subtitle,
    fontSize: 14,
    textAlign: "center",
    maxWidth: 320,
    marginBottom: spacing.xl,
  },
  emptyButton: {
    backgroundColor: "#111111",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },
  emptyButtonText: {
    color: colors.white,
    fontWeight: "700",
  },
  loadMoreEmptyButton: {
    marginTop: spacing.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#D9D9D9",
  },
  loadMoreEmptyText: { color: "#111111", fontWeight: "700" },
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.35)",
  },
  backdropPress: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: spacing.xxl,
    maxHeight: "80%",
  },
  handle: {
    width: 56,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D9D9D9",
    alignSelf: "center",
    marginTop: spacing.md,
  },
  sheetContent: {
    paddingHorizontal: 20,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
    marginBottom: spacing.xl,
  },
  filterGroup: {
    marginBottom: spacing.xl,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    marginBottom: spacing.md,
  },
  filterOptionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterOption: {
    backgroundColor: "#F5F7F8",
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  filterOptionSelected: {
    backgroundColor: "#7FA5A9",
  },
  filterOptionText: {
    color: "#333333",
    fontSize: 13,
    fontWeight: "600",
  },
  filterOptionTextSelected: {
    color: colors.white,
  },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 10,
  },
  toggleCopy: { flex: 1 },
  toggleTitle: { color: "#111111", fontSize: 14, fontWeight: "700" },
  toggleSubtitle: {
    color: colors.subtitle,
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  sheetActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: spacing.lg,
  },
  secondaryAction: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  secondaryActionText: {
    color: "#111111",
    fontWeight: "700",
  },
  primaryAction: {
    flex: 1,
    backgroundColor: "#111111",
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  primaryActionText: {
    color: colors.white,
    fontWeight: "700",
  },
});
