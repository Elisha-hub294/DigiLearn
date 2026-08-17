import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
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
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import { FeaturedNoteCard } from "../components/home/FeaturedNoteCard";
import { BookCard } from "../components/library/BookCard";
import { TeacherPostCard } from "../components/TeacherPostCard";
import { ActionDialog } from "../components/ui/ActionDialog";
import { LatestVideoCard } from "../components/ui/LatestVideoCard";
import { SearchBar } from "../components/ui/SearchBar";
import { getHorizontalPadding } from "../constants/layout";
import { colors, radius, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";

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

const formatResourceTime = (value: unknown) => {
  const date =
    typeof value === "number"
      ? new Date(value)
      : typeof value === "string"
        ? new Date(value)
        : new Date();
  if (Number.isNaN(date.getTime())) return "Today";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
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
  const { user } = useProfile();
  const params = useLocalSearchParams<{
    name?: string;
    returnTo?: string;
    openedFromAccount?: string;
  }>();
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1000, width - horizontalPadding * 2);
  const compactActionRow = width < 390;
  const actionRowGap = compactActionRow ? 10 : 16;
  const actionIconSize = compactActionRow ? 46 : 54;
  const returnTo =
    typeof params.returnTo === "string" && params.returnTo.trim()
      ? params.returnTo.trim()
      : undefined;
  const openedFromAccount = params.openedFromAccount === "true";

  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TeacherTab>("All");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCommunityDialogVisible, setCommunityDialogVisible] = useState(false);
  const pulseAnim = useRef(new RNAnimated.Value(0.45)).current;

  const teacherName = String(params.name ?? "Teacher").trim();
  const normalizedTeacherName = normalizeKey(teacherName);
  const accentColor = teacher?.accent || colors.primaryDark;
  const teacherFirstName =
    (teacher?.name || teacherName).split(" ")[0] || "Teacher";
  const isOwnProfile = teacher?.id === user?.uid;

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

  const fetchTeacherResources = useCallback(async () => {
    if (!teacherName) return;

    try {
      const [pagesSnap, booksSnap, postSnapshots, lessonsSnap] =
        await Promise.all([
          getDocs(query(collection(db, "pages"), orderBy("createdAt", "desc"))),
          getDocs(query(collection(db, "books"), orderBy("createdAt", "desc"))),
          Promise.all([
            getDocs(
              query(
                collection(db, "teacherPosts"),
                orderBy("createdAt", "desc"),
              ),
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

      const postCollections = postSnapshots.flatMap(
        (snapshot) => snapshot.docs,
      );
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
    await Promise.all([fetchTeacherProfile(), fetchTeacherResources()]);
    setLoading(false);
  }, [fetchTeacherProfile, fetchTeacherResources]);

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
    const youtube = teacher?.youtube;
    if (!youtube) return;
    const firstName = teacher.name.split(" ")[0] || "Teacher";
    Alert.alert(`Visit ${firstName}'s YouTube channel?`, "", [
      {
        text: "Confirm",
        onPress: () => {
          Linking.openURL(youtube);
        },
      },
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

  const openCommunityDialog = useCallback(() => {
    setCommunityDialogVisible(true);
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const renderHeader = useCallback(
    () => (
      <>
        <View style={styles.headerWrap}>
          <View
            style={[styles.headerPanel, { backgroundColor: accentColor }]}
          />
          {!openedFromAccount && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              style={styles.backButton}
              onPress={() => {
                if (returnTo) {
                  router.replace(returnTo as any);
                  return;
                }

                if (router.canGoBack()) {
                  router.back();
                  return;
                }

                router.replace("/search" as any);
              }}
            >
              <Icon name="arrow-left" size={20} color="#ffffff" />
            </Pressable>
          )}

          {isOwnProfile && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open settings"
              style={styles.settingsButton}
              onPress={() => router.push("/settings")}
            >
              <Icon name="settings" size={20} color="#F8FAFC" />
            </Pressable>
          )}

          <View style={styles.avatarShell}>
            <Image
              source={{
                uri:
                  teacher?.avatar ||
                  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/user-default.png",
              }}
              style={[styles.avatar, { borderColor: accentColor }]}
              contentFit="cover"
            />
          </View>
        </View>

        <View style={styles.profileBody}>
          <View style={styles.nameRow}>
            <Text style={[styles.nameText, { color: accentColor }]}>
              {teacher?.name || teacherName}
            </Text>
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

          <View style={[styles.contactRow, { gap: actionRowGap }]}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isOwnProfile ? "Publish" : "Contact teacher"}
              style={[styles.contactButton, { backgroundColor: accentColor }]}
              onPress={openContactSheet}
            >
              <Text style={styles.contactButtonText}>
                {isOwnProfile ? "Publish" : "Contact"}
              </Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Visit teacher YouTube"
              style={[
                styles.iconButton,
                { width: actionIconSize, height: actionIconSize },
              ]}
              onPress={openYoutubePrompt}
            >
              <Icon name="youtube" size={22} color={accentColor} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Email teacher"
              style={[
                styles.iconButton,
                { width: actionIconSize, height: actionIconSize },
              ]}
              onPress={openEmailPrompt}
            >
              <Icon name="mail" size={22} color={accentColor} />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open teacher community"
              style={[
                styles.iconButton,
                { width: actionIconSize, height: actionIconSize },
              ]}
              onPress={openCommunityDialog}
            >
              <Icon name="users" size={22} color={accentColor} />
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
        </View>
      </>
    ),
    [
      accentColor,
      activeTab,
      openContactSheet,
      openEmailPrompt,
      openYoutubePrompt,
      openedFromAccount,
      returnTo,
      router,
      search,
      stats.announcements,
      stats.books,
      stats.lessons,
      stats.pages,
      teacher,
      teacherName,
    ],
  );

  const renderResourceCard = useCallback(
    ({ item, index }: { item: ResourceItem; index: number }) => {
      if (item.type === "page") {
        return (
          <FeaturedNoteCard
            notes={[
              {
                id: item.id,
                title: item.title,
                description: item.description,
                subject: item.subject,
                document: item.document,
                book: item.book,
                createdAt: item.createdAt,
              },
            ]}
            source="pages"
          />
        );
      }

      if (item.type === "book") {
        return (
          <BookCard
            item={{
              id: item.id,
              title: item.title,
              author: Array.isArray(item.author)
                ? item.author[0] || "Unknown author"
                : item.author || "Unknown author",
              description: item.description || "",
              image: item.image
                ? { uri: item.image }
                : require("../../assets/images/pdf-preview.jpeg"),
            }}
            width={contentMaxWidth}
            onPress={() => {
              router.push({
                pathname: "/book-preview",
                params: {
                  id: item.id,
                  source: "teacher-profile",
                  returnTo: "/teacher-profile",
                  teacherName: teacher?.name || teacherName,
                },
              } as any);
            }}
          />
        );
      }

      if (item.type === "announcement") {
        return (
          <TeacherPostCard
            post={{
              id: item.id,
              teacherName: teacher?.name || teacherName,
              teacherImage: {
                uri:
                  teacher?.avatar ||
                  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/user-default.png",
              },
              verified: teacher?.verified ?? false,
              time: formatResourceTime(item.createdAt),
              content: item.description || item.title,
              previewImage: {
                uri:
                  item.image ||
                  teacher?.avatar ||
                  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/user-default.png",
              },
              type: "announcement",
              subject: (item.subject as any) || "English",
            }}
            hidePreview={true}
            hideActions={true}
          />
        );
      }

      return (
        <LatestVideoCard
          item={{
            id: item.id,
            title: item.title,
            subject: item.subject || "",
            teacher: item.teacher || teacher?.name || teacherName,
            uploadedAt: formatResourceTime(item.createdAt),
            duration: item.duration || "0:00",
            thumbnail: item.thumbnail || item.image || "",
            avatar: teacher?.avatar,
            link: item.link || "",
            isNew: false,
          }}
          index={index}
        />
      );
    },
    [contentMaxWidth, router, teacher, teacherName],
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Animated.View
          entering={FadeInUp.duration(420)}
          style={[
            styles.loadingContainer,
            { maxWidth: contentMaxWidth, paddingHorizontal: horizontalPadding },
          ]}
        >
          <RNAnimated.View
            style={[styles.skeletonHeader, { opacity: pulseAnim }]}
          />
          <View style={styles.loadingBody}>
            <RNAnimated.View
              style={[styles.skeletonAvatar, { opacity: pulseAnim }]}
            />
            <RNAnimated.View
              style={[styles.skeletonTitle, { opacity: pulseAnim }]}
            />
            <RNAnimated.View
              style={[styles.skeletonBio, { opacity: pulseAnim }]}
            />
            <RNAnimated.View
              style={[styles.skeletonLine, { opacity: pulseAnim }]}
            />
            <RNAnimated.View
              style={[styles.skeletonLineShort, { opacity: pulseAnim }]}
            />
          </View>
        </Animated.View>
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
        <FlatList
          data={filteredResources}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.resourceList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accentColor}
            />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <Icon name="inbox" size={38} color={accentColor} />
              <Text style={styles.emptyText}>
                {errorMessage ||
                  "No matching resources found for this teacher."}
              </Text>
            </View>
          )}
          renderItem={renderResourceCard}
        />
        <ActionDialog
          visible={isCommunityDialogVisible}
          icon={<Icon name="users" size={24} color="#2563EB" />}
          title={`Join ${teacherFirstName}'s Community?`}
          message={`You're about to leave DigiLearn and open ${teacherFirstName}'s WhatsApp community channel. Would you like to continue?`}
          primaryText="Continue"
          secondaryText="Cancel"
          onPrimary={() => undefined}
          onSecondary={() => setCommunityDialogVisible(false)}
          onClose={() => setCommunityDialogVisible(false)}
        />
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
    height: 220,
  },
  headerPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
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
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  settingsButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 3,
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 28, 81, 0.48)",
  },
  avatarShell: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 3,
  },
  avatar: {
    width: 150,
    height: 150,
    borderRadius: 100,
    borderWidth: 5,
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
    backgroundColor: "#e9e9e9",
    borderRadius: 16,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.subtitle,
    marginTop: 2,
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
    borderRadius: 10,
  },
  contactButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "500",
  },
  iconButton: {
    width: 54,
    height: 54,
    borderRadius: 10,
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
    fontWeight: "600",
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
    fontWeight: "500",
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
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.background,
  },
  skeletonHeader: {
    height: 250,
    backgroundColor: "#E5E7EB",
  },
  loadingBody: {
    alignItems: "center",
    marginTop: -70,
  },
  skeletonAvatar: {
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: "#D1D5DB",
    marginBottom: 20,
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
    marginBottom: 6,
  },
  skeletonLine: {
    width: 200,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    marginBottom: 6,
  },
  skeletonLineShort: {
    width: 140,
    height: 14,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
});
