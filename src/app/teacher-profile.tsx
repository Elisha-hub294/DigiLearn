import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
    collection,
    getDocs,
    orderBy,
    query
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    FlatList,
    Linking,
    Pressable,
    RefreshControl,
    Animated as RNAnimated,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import { SearchBar } from "../components/ui/SearchBar";
import {
    colors,
    radius,
    shadows,
    spacing
} from "../constants/theme";

type TeacherRecord = {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  accent?: string;
  phone?: string;
  email?: string;
  youtube?: string;
  verified?: boolean;
  subjects?: string[];
  createdAt?: unknown;
};

type ResourceItem = {
  id: string;
  type: "page" | "book" | "announcement" | "lesson";
  title: string;
  description?: string;
  createdAt?: unknown;
  subject?: string;
  document?: string;
  hasPdf?: boolean;
  teacher?: string;
  image?: string;
  link?: string;
  thumbnail?: string;
  duration?: string;
  book?: string | string[];
  author?: string | string[];
  data?: Record<string, unknown>;
};

const normalizeKey = (value?: string) =>
  (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");

const pickString = (value: unknown, fallback = "") =>
  typeof value === "string" && value.trim() ? value.trim() : fallback;

const pickArray = (value: unknown): string[] => {
  if (Array.isArray(value)) {
    return value.map((entry) => pickString(entry)).filter(Boolean);
  }
  const single = pickString(value);
  return single ? [single] : [];
};

const getCreatedAt = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  return 0;
};

const formatRelativeCount = (value: number) =>
  value > 999 ? `${(value / 1000).toFixed(1)}k` : `${value}`;

const teacherTabOptions = [
  "All",
  "Pages",
  "Books",
  "Announcements",
  "Lessons",
] as const;
type TeacherTab = (typeof teacherTabOptions)[number];

export default function TeacherProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ name?: string }>();
  const { width } = useWindowDimensions();
  const horizontalPadding =
    width >= 1024 ? 48 : width >= 768 ? 32 : width >= 400 ? 20 : 14;
  const contentMaxWidth = Math.min(1000, width - horizontalPadding * 2);

  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TeacherTab>("All");
  const [booksMap, setBooksMap] = useState<Record<string, string[]>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pulseAnim = useRef(new RNAnimated.Value(0.45)).current;

  const teacherName = String(params.name ?? "Teacher").trim();
  const normalizedTeacherName = normalizeKey(teacherName);
  const accentColor = teacher?.accent || colors.primary;

  const fetchTeacherProfile = useCallback(async () => {
    try {
      const teachersRef = collection(db, "teachers");
      const snapshot = await getDocs(teachersRef);
      const matched = snapshot.docs.find((doc) => {
        const data = doc.data() as Record<string, unknown>;
        const name = pickString(data.name);
        return normalizeKey(name) === normalizedTeacherName;
      });

      if (!matched) {
        setTeacher(null);
        return;
      }

      const data = matched.data() as Record<string, unknown>;
      setTeacher({
        id: matched.id,
        name: pickString(data.name, teacherName),
        avatar: pickString(data.avatar),
        bio: pickString(data.bio, "Teacher at DigiLearn"),
        accent: pickString(data.accent, colors.primary),
        phone: pickString(data.phone),
        email: pickString(data.email),
        youtube: pickString(data.youtube),
        verified: Boolean(data.verified),
        subjects: pickArray(data.subjects),
        createdAt: data.createdAt,
      });
    } catch (err) {
      console.error("Failed to load teacher profile:", err);
      setTeacher(null);
    }
  }, [normalizedTeacherName, teacherName]);

  const fetchBooksMeta = useCallback(async () => {
    const snapshot = await getDocs(collection(db, "books"));
    const titleMap: Record<string, string[]> = {};

    snapshot.docs.forEach((doc) => {
      const data = doc.data() as Record<string, unknown>;
      const title = pickString(data.title);
      const authors = pickArray(data.author);
      if (title) {
        titleMap[normalizeKey(title)] = authors;
      }
    });

    setBooksMap(titleMap);
  }, []);

  const fetchTeacherResources = useCallback(async () => {
    if (!teacherName) return;

    try {
      const [pagesSnap, booksSnap, postsSnap, lessonsSnap] = await Promise.all([
        getDocs(query(collection(db, "pages"), orderBy("createdAt", "desc"))),
        getDocs(query(collection(db, "books"), orderBy("createdAt", "desc"))),
        Promise.all([
          getDocs(
            query(collection(db, "teacherPosts"), orderBy("createdAt", "desc")),
          ),
          getDocs(
            query(
              collection(db, "teacherPostsCards"),
              orderBy("createdAt", "desc"),
            ),
          ),
          getDocs(
            query(
              collection(db, "teacherUpdates"),
              orderBy("createdAt", "desc"),
            ),
          ),
        ]),
        getDocs(
          query(
            collection(db, "trendingLessons"),
            orderBy("createdAt", "desc"),
          ),
        ),
      ]);

      const allBooks = booksSnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const bookMatchSet = new Set<string>();
      allBooks.forEach((item) => {
        const authors = pickArray((item as Record<string, unknown>).author);
        if (
          authors.some((entry) => normalizeKey(entry) === normalizedTeacherName)
        ) {
          bookMatchSet.add(
            normalizeKey(pickString((item as Record<string, unknown>).title)),
          );
        }
      });

      const pageResources: ResourceItem[] = pagesSnap.docs
        .map((doc) => ({
          id: doc.id,
          data: doc.data() as Record<string, unknown>,
        }))
        .filter((entry) => {
          const pageData = entry.data as Record<string, unknown>;
          const pageBooks = pickArray(pageData.book);
          const matchedBook = pageBooks.some((bookEntry) =>
            bookMatchSet.has(normalizeKey(bookEntry)),
          );
          return matchedBook;
        })
        .map((entry) => {
          const data = entry.data as Record<string, unknown>;
          return {
            id: entry.id,
            type: "page",
            title: pickString(data.title, "Untitled note"),
            description: pickString(data.description),
            subject: pickString(data.subject),
            createdAt: data.createdAt,
            document: pickString(data.document),
            book: pickArray(data.book),
          } as ResourceItem;
        });

      const bookResources: ResourceItem[] = allBooks
        .filter((entry) => {
          const authors = pickArray((entry as Record<string, unknown>).author);
          return authors.some(
            (item) => normalizeKey(item) === normalizedTeacherName,
          );
        })
        .map((entry) => ({
          id: (entry as { id: string }).id,
          type: "book",
          title: pickString(
            (entry as Record<string, unknown>).title,
            "Untitled book",
          ),
          description: pickString(
            (entry as Record<string, unknown>).description,
          ),
          createdAt: (entry as Record<string, unknown>).createdAt,
          image: pickString(
            (entry as Record<string, unknown>).image ||
              (entry as Record<string, unknown>).cover,
          ),
          author: pickArray((entry as Record<string, unknown>).author),
        }));

      const postCollections = postsSnap
        .flat()
        .filter((doc) => doc.exists !== false);
      const announcementResources: ResourceItem[] = postCollections
        .map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const teacherValue = pickString(data.teacher || data.teacherName);
          const hasPdf = Boolean(data.hasPdf ?? data.document);
          return {
            id: doc.id,
            type: "announcement",
            title: pickString(data.subject || data.title || "Teacher update"),
            description: pickString(
              data.description || data.content || data.message,
            ),
            createdAt: data.createdAt,
            teacher: teacherValue,
            document: pickString(data.document),
            hasPdf,
          } as ResourceItem;
        })
        .filter(
          (item) =>
            normalizeKey(item.teacher) === normalizedTeacherName &&
            !item.hasPdf,
        );

      const lessonResources: ResourceItem[] = lessonsSnap.docs
        .map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const teacherValue = pickString(data.teacher);
          return {
            id: doc.id,
            type: "lesson",
            title: pickString(data.title, "Untitled lesson"),
            description: pickString(data.subject),
            createdAt: data.createdAt,
            teacher: teacherValue,
            thumbnail: pickString(data.thumbnail),
            link: pickString(data.link),
            duration: pickString(data.duration),
          } as ResourceItem;
        })
        .filter((item) => normalizeKey(item.teacher) === normalizedTeacherName);

      const merged = [
        ...pageResources,
        ...bookResources,
        ...announcementResources,
        ...lessonResources,
      ].sort((a, b) => {
        const left = getCreatedAt(a.createdAt);
        const right = getCreatedAt(b.createdAt);
        if (left === right) return 0;
        return Number(right) - Number(left);
      });

      setResources(merged);
      setErrorMessage(
        merged.length === 0
          ? `No resources published for ${teacherName} yet.`
          : null,
      );
    } catch (err) {
      console.error("Failed to load teacher resources:", err);
      setResources([]);
      setErrorMessage("We could not load this teacher’s resources right now.");
    }
  }, [normalizedTeacherName, teacherName]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchTeacherProfile(),
      fetchBooksMeta(),
      fetchTeacherResources(),
    ]);
    setLoading(false);
  }, [fetchBooksMeta, fetchTeacherProfile, fetchTeacherResources]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    const tabFilter = activeTab;

    const scoped = resources.filter((resource) => {
      if (tabFilter === "All") return true;
      if (tabFilter === "Pages") return resource.type === "page";
      if (tabFilter === "Books") return resource.type === "book";
      if (tabFilter === "Announcements")
        return resource.type === "announcement";
      if (tabFilter === "Lessons") return resource.type === "lesson";
      return true;
    });

    if (!query || query.length < 2) return scoped;

    return scoped.filter((resource) => {
      const haystack = [
        resource.title,
        resource.description,
        resource.subject,
        resource.teacher,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [activeTab, resources, search]);

  const stats = useMemo(() => {
    return {
      pages: resources.filter((item) => item.type === "page").length,
      books: resources.filter((item) => item.type === "book").length,
      lessons: resources.filter((item) => item.type === "lesson").length,
      announcements: resources.filter((item) => item.type === "announcement")
        .length,
    };
  }, [resources]);

  const openContactSheet = useCallback(() => {
    if (!teacher) return;
    Alert.alert("Contact teacher", "Choose how you want to reach out.", [
      {
        text: "Text on WhatsApp",
        onPress: () => {
          const firstName = teacher.name.split(" ")[0] || "Teacher";
          const message = `Hello Teacher ${firstName}.`;
          const url = `https://wa.me/${teacher.phone}?text=${encodeURIComponent(message)}`;
          Linking.openURL(url);
        },
      },
      {
        text: "Phone Call",
        onPress: () => {
          if (teacher.phone) {
            Linking.openURL(`tel:${teacher.phone}`);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [teacher]);

  const openYoutubePrompt = useCallback(() => {
    if (!teacher?.youtube) return;
    const firstName = teacher.name.split(" ")[0] || "Teacher";
    Alert.alert(`Visit ${firstName}'s YouTube channel?`, "", [
      { text: "Confirm", onPress: () => Linking.openURL(teacher.youtube) },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [teacher]);

  const openEmailPrompt = useCallback(() => {
    if (!teacher?.email) return;
    Alert.alert(`Email ${teacher.name}?`, "", [
      {
        text: "Confirm",
        onPress: () => {
          const subject = encodeURIComponent("Email From DigiLearn");
          Linking.openURL(`mailto:${teacher.email}?subject=${subject}`);
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [teacher]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const renderResourceCard = useCallback(
    ({ item }: { item: ResourceItem }) => {
      if (item.type === "page") {
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open page: ${item.title}`}
            onPress={() =>
              router.push({
                pathname: "/page-preview",
                params: { id: item.id },
              } as never)
            }
            style={styles.resourceCard}
          >
            <View style={styles.cardRow}>
              <View style={styles.resourceBadge}>
                <Text style={styles.resourceBadgeText}>Page</Text>
              </View>
              <Text style={styles.resourceMeta}>
                {item.subject || "Featured note"}
              </Text>
            </View>
            <Text style={styles.resourceTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.resourceDescription} numberOfLines={2}>
                {item.description}
              </Text>
            ) : null}
          </Pressable>
        );
      }

      if (item.type === "book") {
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open book: ${item.title}`}
            onPress={() =>
              router.push({
                pathname: "/book-preview",
                params: { id: item.id, source: "teacher-profile" },
              } as never)
            }
            style={styles.resourceCard}
          >
            <View style={styles.cardRow}>
              <View style={styles.resourceBadge}>
                <Text style={styles.resourceBadgeText}>Book</Text>
              </View>
              <Text style={styles.resourceMeta}>
                {item.author?.[0] || "Teacher authored"}
              </Text>
            </View>
            <Text style={styles.resourceTitle}>{item.title}</Text>
            {item.image ? (
              <Image
                source={{ uri: item.image }}
                style={styles.bookImage}
                contentFit="cover"
              />
            ) : null}
          </Pressable>
        );
      }

      if (item.type === "announcement") {
        return (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open announcement: ${item.title}`}
            onPress={() => {
              if (item.document) {
                Linking.openURL(item.document);
              }
            }}
            style={styles.resourceCard}
          >
            <View style={styles.cardRow}>
              <View style={styles.resourceBadge}>
                <Text style={styles.resourceBadgeText}>Announcement</Text>
              </View>
              <Text style={styles.resourceMeta}>
                {item.subject || "Update"}
              </Text>
            </View>
            <Text style={styles.resourceTitle}>{item.title}</Text>
            {item.description ? (
              <Text style={styles.resourceDescription} numberOfLines={3}>
                {item.description}
              </Text>
            ) : null}
          </Pressable>
        );
      }

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open lesson: ${item.title}`}
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
            } as never)
          }
          style={styles.resourceCard}
        >
          <View style={styles.cardRow}>
            <View style={styles.resourceBadge}>
              <Text style={styles.resourceBadgeText}>Lesson</Text>
            </View>
            <Text style={styles.resourceMeta}>{item.duration || "Video"}</Text>
          </View>
          <Text style={styles.resourceTitle}>{item.title}</Text>
          {item.thumbnail ? (
            <Image
              source={{ uri: item.thumbnail }}
              style={styles.lessonImage}
              contentFit="cover"
            />
          ) : null}
        </Pressable>
      );
    },
    [router],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[styles.skeletonHeader, { opacity: pulseAnim }]}
          />
          <View style={styles.loadingBody}>
            <Animated.View
              style={[styles.skeletonAvatar, { opacity: pulseAnim }]}
            />
            <Animated.View
              style={[styles.skeletonTitle, { opacity: pulseAnim }]}
            />
            <Animated.View
              style={[styles.skeletonBio, { opacity: pulseAnim }]}
            />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View
        entering={FadeInUp.duration(420)}
        style={[
          styles.container,
          { maxWidth: contentMaxWidth, paddingHorizontal: horizontalPadding },
        ]}
      >
        <View style={styles.headerWrap}>
          <View
            style={[styles.headerPanel, { backgroundColor: accentColor }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Icon name="arrow-left" size={20} color="#ffffff" />
          </Pressable>

          <View style={styles.avatarShell}>
            <Image
              source={{
                uri:
                  teacher?.avatar ||
                  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/tr-default.png",
              }}
              style={styles.avatar}
              contentFit="cover"
            />
          </View>
        </View>

        <View style={styles.profileBody}>
          <View style={styles.nameRow}>
            <Text style={[styles.nameText, { color: accentColor }]}>
              {teacher?.name || teacherName}
            </Text>
            {teacher?.verified ? (
              <View style={styles.verifiedBadge}>
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}
          </View>

          <Text style={styles.bioText} numberOfLines={3}>
            {teacher?.bio || "Teacher at DigiLearn."}
          </Text>

          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>
                {formatRelativeCount(stats.pages)}
              </Text>
              <Text style={styles.statLabel}>Pages</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>
                {formatRelativeCount(stats.books)}
              </Text>
              <Text style={styles.statLabel}>Books</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>
                {formatRelativeCount(stats.lessons)}
              </Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statValue}>
                {formatRelativeCount(stats.announcements)}
              </Text>
              <Text style={styles.statLabel}>Updates</Text>
            </View>
          </View>

          {teacher?.subjects?.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.subjectRow}
            >
              {teacher.subjects.map((subject) => (
                <View
                  key={subject}
                  style={[styles.subjectChip, { borderColor: accentColor }]}
                >
                  <Text
                    style={[styles.subjectChipText, { color: accentColor }]}
                  >
                    {subject}
                  </Text>
                </View>
              ))}
            </ScrollView>
          ) : null}

          <View style={styles.contactRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Contact teacher"
              style={[styles.contactButton, { backgroundColor: accentColor }]}
              onPress={openContactSheet}
            >
              <Text style={styles.contactButtonText}>Contact</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Visit teacher YouTube"
              style={styles.iconButton}
              onPress={openYoutubePrompt}
            >
              <Icon name="youtube" size={22} color={accentColor} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Email teacher"
              style={styles.iconButton}
              onPress={openEmailPrompt}
            >
              <Icon name="mail" size={22} color={accentColor} />
            </Pressable>
          </View>

          <Text style={styles.sectionTitle}>Resources</Text>

          <SearchBar
            isInput={true}
            showBack={false}
            value={search}
            onChangeText={setSearch}
            placeholder={`Search ${teacher?.name?.split(" ")[0] || "teacher"}'s resources`}
            autoFocus={false}
            searchIconColor={accentColor}
            inputContainerStyle={{ borderColor: accentColor }}
            containerStyle={styles.searchBarOuter}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabRow}
          >
            {teacherTabOptions.map((tab) => {
              const isActive = activeTab === tab;
              return (
                <Pressable
                  key={tab}
                  accessibilityRole="button"
                  accessibilityLabel={`Filter resources by ${tab}`}
                  onPress={() => setActiveTab(tab)}
                  style={[
                    styles.tabButton,
                    isActive && { backgroundColor: accentColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.tabButtonText,
                      isActive ? styles.tabButtonTextActive : null,
                    ]}
                  >
                    {tab}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.resourceListWrap}>
            {filteredResources.length === 0 ? (
              <View style={styles.emptyState}>
                <Icon name="inbox" size={38} color={accentColor} />
                <Text style={styles.emptyText}>
                  No matching resources found for this teacher.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredResources}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={styles.resourceList}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor={accentColor}
                  />
                }
                renderItem={renderResourceCard}
              />
            )}
          </View>
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
  },
  headerWrap: {
    position: "relative",
    height: 260,
    marginBottom: 56,
  },
  headerPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 240,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  backButton: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 3,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  avatarShell: {
    position: "absolute",
    bottom: -52,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 3,
  },
  avatar: {
    width: 126,
    height: 126,
    borderRadius: 63,
    borderWidth: 5,
    borderColor: colors.white,
    shadowColor: "#0F172A",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 7 },
    elevation: 6,
  },
  profileBody: {
    paddingTop: 14,
    paddingBottom: spacing.xxl,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  nameText: {
    fontSize: 28,
    fontWeight: "800",
    textAlign: "center",
  },
  verifiedBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  verifiedText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  bioText: {
    marginTop: spacing.sm,
    color: "#6B7280",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
  statsRow: {
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  statChip: {
    flex: 1,
    alignItems: "center",
    paddingVertical: spacing.sm,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.subtitle,
    marginTop: 2,
  },
  subjectRow: {
    gap: 8,
    paddingVertical: spacing.md,
  },
  subjectChip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#FFFFFF",
  },
  subjectChipText: {
    fontSize: 12,
    fontWeight: "700",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: spacing.md,
  },
  contactButton: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 16,
  },
  contactButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  iconButton: {
    width: 54,
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    color: colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  searchBarOuter: {
    marginBottom: spacing.md,
  },
  tabRow: {
    gap: 8,
    paddingBottom: spacing.sm,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "transparent",
  },
  tabButtonText: {
    color: "#6B7280",
    fontSize: 13,
    fontWeight: "700",
  },
  tabButtonTextActive: {
    color: colors.white,
  },
  resourceListWrap: {
    marginTop: spacing.sm,
  },
  resourceList: {
    gap: 12,
    paddingBottom: spacing.xxl,
  },
  resourceCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    ...shadows.soft,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  resourceBadge: {
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  resourceBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },
  resourceMeta: {
    color: colors.subtitle,
    fontSize: 12,
    fontWeight: "600",
  },
  resourceTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 6,
  },
  resourceDescription: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 18,
  },
  bookImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginTop: 10,
  },
  lessonImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    marginTop: 10,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    minHeight: 180,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  emptyText: {
    marginTop: 10,
    color: colors.subtitle,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  skeletonHeader: {
    height: 280,
    backgroundColor: "#E5E7EB",
  },
  loadingBody: {
    alignItems: "center",
    marginTop: -42,
  },
  skeletonAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#D1D5DB",
    marginBottom: 18,
  },
  skeletonTitle: {
    width: 180,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginBottom: 10,
  },
  skeletonBio: {
    width: 260,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
});
