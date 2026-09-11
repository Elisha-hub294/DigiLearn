import { FirebaseImage as Image } from "@/components/ui/FirebaseImage";
import { Feather as Icon } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Linking,
  Platform,
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
import { TeacherPostItem } from "../components/home/TeacherPostCard";
import { BookCard } from "../components/library/BookCard";
import { SavedResources } from "../components/profile/SavedResources";
import { ActionDialog } from "../components/ui/ActionDialog";
import { SearchBar } from "../components/ui/SearchBar";
import { VideoCard } from "../components/ui/VideoCard";
import { getHorizontalPadding } from "../constants/layout";
import { colors, radius, spacing } from "../constants/theme";
import { getThemeAsset } from "../constants/themeAssets";
import { useProfile } from "../contexts/ProfileContext";
import { useTheme } from "../contexts/ThemeContext";
import {
  getTeacherCommunityStatus,
  setTeacherCommunityMembership,
} from "../services/teacherCommunity";

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
  type: "page" | "book" | "announcement" | "lesson" | "pdf" | "image";
  title: string;
  description?: string;
  createdAt?: unknown;
  subject?: string;
  document?: string;
  hasCover?: boolean | string;
  ownerType?: string;
  fileType?: "image" | "doc" | "";
  teacher?: string;
  owner?: string;
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

const getResourcePreview = (data: Record<string, unknown>) =>
  pickString(data.cover || data.image || data.preview || data.previewImage);

const getHasResourcePreview = (data: Record<string, unknown>) => {
  if (typeof data.hasCover === "boolean") return data.hasCover;
  if (typeof data.hasCover === "string") {
    const value = data.hasCover.trim().toLowerCase();
    if (value === "true") return true;
    if (value === "false") return false;
  }
  return Boolean(getResourcePreview(data));
};

const getTeacherAvatar = (data: Record<string, unknown>) =>
  pickString(
    data.avatar ||
      data.image ||
      data.imageUrl ||
      data.profileImage ||
      data.photoURL,
  );

const getCreatedAt = (value: unknown) => {
  if (
    value &&
    typeof value === "object" &&
    "toMillis" in value &&
    typeof value.toMillis === "function"
  ) {
    return value.toMillis();
  }
  if (typeof value === "number") return value;
  if (typeof value === "string") return value;
  return 0;
};

const getResourceDate = (data: Record<string, unknown>) =>
  data.createdAt ?? data.updatedAt ?? data.uploadedAt;

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
  "Saved",
] as const;
type TeacherTab = (typeof teacherTabOptions)[number];

type ContactDialogState = {
  title: string;
  message: string;
  primaryText: string;
  secondaryText?: string;
  onPrimary: () => void;
  onSecondary?: () => void;
};

export default function TeacherProfileScreen() {
  const router = useRouter();
  const { user, profile } = useProfile();
  const { colors: themeColors, isDark } = useTheme();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
  }>();
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1000, width - horizontalPadding * 2);
  const avatarSize = Math.min(150, Math.max(104, width * 0.32));
  const compactActionRow = width < 390;
  const actionRowGap = compactActionRow ? 10 : 16;
  const actionIconSize = compactActionRow ? 46 : 54;
  const [teacher, setTeacher] = useState<TeacherRecord | null>(null);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<TeacherTab>("All");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAvatarUri, setFailedAvatarUri] = useState<string | null>(null);
  const [contactDialog, setContactDialog] = useState<ContactDialogState | null>(
    null,
  );
  const [isCommunityDialogVisible, setCommunityDialogVisible] = useState(false);
  const [isCommunityMember, setCommunityMember] = useState(false);
  const [isCommunityActionPending, setCommunityActionPending] = useState(false);
  const [pulseAnim] = useState(() => new RNAnimated.Value(0.45));
  const fallbackAvatar = getThemeAsset("userDefault", isDark);

  const teacherName = String(params.name ?? "Teacher").trim();
  const normalizedTeacherName = normalizeKey(teacherName);
  const accentColor = teacher?.accent || colors.primaryDark;
  const teacherFirstName =
    (teacher?.name || teacherName).split(" ")[0] || "Teacher";
  const hasPhone = Boolean(teacher?.phone);
  const hasYoutube = Boolean(teacher?.youtube);
  const hasEmail = Boolean(teacher?.email);
  const hasCommunityLink = hasPhone || hasYoutube;
  const isOwnProfile =
    (teacher?.id && user?.uid && teacher.id === user.uid) ||
    (user?.uid && params.id === user.uid) ||
    Boolean(
      profile?.type === "teacher" &&
      teacher &&
      normalizeKey(profile.name) === normalizeKey(teacher.name),
    );
  const viewerRole: "own" | "teacher" | "student" = isOwnProfile
    ? "own"
    : profile?.type === "teacher"
      ? "teacher"
      : "student";
  const canViewSaved = Boolean(isOwnProfile && profile?.type === "teacher");

  const fetchTeacherProfile =
    useCallback(async (): Promise<TeacherRecord | null> => {
      try {
        if (params.id) {
          const teacherDocRef = doc(db, "teachers", params.id);
          const docSnap = await getDoc(teacherDocRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as Record<string, unknown>;
            const teacherRecord = {
              id: docSnap.id,
              name: pickString(data.name, teacherName),
              avatar: getTeacherAvatar(data),
              bio: pickString(data.bio, "Teacher at DigiLearn"),
              accent: pickString(data.accent, colors.primaryDark),
              phone: pickString(data.phone),
              email: pickString(data.email),
              youtube: pickString(data.youtube),
              verified: Boolean(data.verified),
              subjects: pickArray(data.subjects),
              createdAt: data.createdAt,
            };
            setTeacher(teacherRecord);
            return teacherRecord;
          }
        }

        const teachersRef = collection(db, "teachers");
        const snapshot = await getDocs(teachersRef);
        const matched = snapshot.docs.find((d) => {
          const data = d.data() as Record<string, unknown>;
          const name = pickString(data.name);
          return (
            (params.id && d.id === params.id) ||
            normalizeKey(name) === normalizedTeacherName
          );
        });

        if (!matched) {
          setTeacher(null);
          return null;
        }

        const data = matched.data() as Record<string, unknown>;
        const teacherRecord = {
          id: matched.id,
          name: pickString(data.name, teacherName),
          avatar: getTeacherAvatar(data),
          bio: pickString(data.bio, "Teacher at DigiLearn"),
          accent: pickString(data.accent, colors.primary),
          phone: pickString(data.phone),
          email: pickString(data.email),
          youtube: pickString(data.youtube),
          verified: Boolean(data.verified),
          subjects: pickArray(data.subjects),
          createdAt: data.createdAt,
        };
        setTeacher(teacherRecord);
        return teacherRecord;
      } catch (err) {
        console.error("Failed to load teacher profile:", err);
        setTeacher(null);
        return null;
      }
    }, [normalizedTeacherName, params.id, teacherName]);

  const fetchTeacherResources = useCallback(
    async (teacherId: string) => {
      if (!teacherId) {
        setResources([]);
        setErrorMessage(`No resources published for ${teacherName} yet.`);
        return;
      }

      try {
        const [
          pagesSnap,
          booksSnap,
          pastPapersSnap,
          postSnapshots,
          lessonsSnap,
        ] = await Promise.all([
          getDocs(collection(db, "pages")),
          getDocs(collection(db, "books")),
          getDocs(collection(db, "pastPaper")),
          Promise.all([
            getDocs(collection(db, "teacherPosts")),
            getDocs(collection(db, "teacherPostsCards")),
            getDocs(collection(db, "teacherUpdates")),
          ]),
          getDocs(collection(db, "trendingLessons")),
        ]);

        const matchesTeacher = (data: Record<string, unknown>) => {
          return pickString(data.owner) === teacherId;
        };

        const allBooks = booksSnap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        const pageResources: ResourceItem[] = pagesSnap.docs
          .map((doc) => ({
            id: doc.id,
            data: doc.data() as Record<string, unknown>,
          }))
          .filter((entry) => {
            const pageData = entry.data as Record<string, unknown>;
            return matchesTeacher(pageData);
          })
          .map((entry) => {
            const data = entry.data as Record<string, unknown>;
            return {
              id: entry.id,
              type: "page",
              title: pickString(data.title, "Untitled note"),
              description: pickString(data.description),
              subject: pickString(data.subject),
              createdAt: getResourceDate(data),
              document: pickString(data.document),
              image: getResourcePreview(data),
              hasCover: getHasResourcePreview(data),
              book: pickArray(data.book),
              owner: pickString(data.owner),
            } as ResourceItem;
          });

        const bookResources: ResourceItem[] = allBooks
          .filter((entry) => {
            return matchesTeacher(entry as Record<string, unknown>);
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
            createdAt: getResourceDate(entry as Record<string, unknown>),
            image: getResourcePreview(entry as Record<string, unknown>),
            author: pickArray((entry as Record<string, unknown>).author),
            owner: pickString((entry as Record<string, unknown>).owner),
          }));

        const paperResources: ResourceItem[] = pastPapersSnap.docs
          .map((doc) => {
            const data = doc.data() as Record<string, unknown>;
            return {
              id: doc.id,
              type: "pdf" as const,
              title: pickString(data.title, "Untitled past paper"),
              description: pickString(data.description),
              subject: pickString(data.subject),
              createdAt: getResourceDate(data),
              document: pickString(data.document),
              image: getResourcePreview(data),
              hasCover: getHasResourcePreview(data),
              owner: pickString(data.owner),
              teacher: pickString(data.teacher || data.teacherName),
              fileType: "doc" as const,
            };
          })
          .filter((item) => matchesTeacher(item as Record<string, unknown>));

        const postCollections = postSnapshots.flatMap(
          (snapshot) => snapshot.docs,
        );
        const announcementResources: ResourceItem[] = postCollections
          .map((doc) => {
            const data = doc.data() as Record<string, unknown>;
            const teacherValue = pickString(data.teacher || data.teacherName);
            const document = pickString(data.document);
            const rawType = pickString(data.type).toLowerCase();
            const type =
              rawType === "image" ? "image" : document ? "pdf" : "announcement";
            return {
              id: doc.id,
              type,
              title: pickString(data.title || data.subject || "Teacher update"),
              description: pickString(
                data.description ||
                  data.descriprion ||
                  data.content ||
                  data.message,
              ),
              createdAt: getResourceDate(data),
              teacher: teacherValue,
              owner: pickString(data.owner),
              document,
              hasCover: getHasResourcePreview(data),
              ownerType: pickString(data.ownerType),
              fileType:
                data.fileType === "image" || data.fileType === "doc"
                  ? data.fileType
                  : "",
              image: getResourcePreview(data),
            } as ResourceItem;
          })
          .filter((item) => matchesTeacher(item as Record<string, unknown>));

        const lessonResources: ResourceItem[] = lessonsSnap.docs
          .map((doc) => {
            const data = doc.data() as Record<string, unknown>;
            const teacherValue = pickString(data.teacher);
            return {
              id: doc.id,
              type: "lesson",
              title: pickString(data.title, "Untitled lesson"),
              description: pickString(data.subject),
              createdAt: getResourceDate(data),
              teacher: teacherValue,
              owner: pickString(data.owner),
              thumbnail: pickString(
                data.thumbnail || data.cover || data.image || data.preview,
              ),
              link: pickString(data.link),
              duration: pickString(data.duration),
            } as ResourceItem;
          })
          .filter((item) => matchesTeacher(item as Record<string, unknown>));

        const merged = [
          ...pageResources,
          ...bookResources,
          ...paperResources,
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
        setErrorMessage(
          "We could not load this teacher’s resources right now.",
        );
      }
    },
    [teacherName],
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    const loadedTeacher = await fetchTeacherProfile();
    await fetchTeacherResources(loadedTeacher?.id || params.id || "");
    if (loadedTeacher?.id && user?.uid && loadedTeacher.id !== user.uid) {
      try {
        setCommunityMember(await getTeacherCommunityStatus(loadedTeacher.id));
      } catch (err) {
        console.error("Failed to load teacher community status:", err);
        setCommunityMember(false);
      }
    } else {
      setCommunityMember(false);
    }
    setLoading(false);
  }, [fetchTeacherProfile, fetchTeacherResources, params.id, user?.uid]);

  useEffect(() => {
    const runLoad = async () => {
      await Promise.resolve();
      await loadData();
    };

    void runLoad();
  }, [loadData]);

  useEffect(() => {
    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: Platform.OS !== "web",
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 0.45,
          duration: 900,
          useNativeDriver: Platform.OS !== "web",
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
      if (tabFilter === "Saved") return false;
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
    const firstName = teacher.name.split(" ")[0] || "Teacher";
    setContactDialog({
      title: "Contact teacher",
      message: "Choose how you want to reach out.",
      primaryText: "WhatsApp",
      secondaryText: "Phone call",
      onPrimary: () => {
        const message = `Hello Teacher ${firstName}.`;
        const url = `https://wa.me/${teacher.phone}?text=${encodeURIComponent(message)}`;
        Linking.openURL(url);
      },
      onSecondary: () => {
        if (teacher.phone) {
          Linking.openURL(`tel:${teacher.phone}`);
        }
      },
    });
  }, [teacher]);

  const openYoutubePrompt = useCallback(() => {
    const youtube = teacher?.youtube;
    if (!youtube) return;
    const firstName = teacher.name.split(" ")[0] || "Teacher";
    setContactDialog({
      title: `Visit ${firstName}'s YouTube channel?`,
      message:
        "You are about to leave DigiLearn and open the teacher's YouTube channel.",
      primaryText: "Confirm",
      secondaryText: "Cancel",
      onPrimary: () => Linking.openURL(youtube),
    });
  }, [teacher]);

  const openEmailPrompt = useCallback(() => {
    if (!teacher?.email) return;
    setContactDialog({
      title: `Email ${teacher.name}?`,
      message: "You are about to open your email app to send a message.",
      primaryText: "Confirm",
      secondaryText: "Cancel",
      onPrimary: () => {
        const subject = encodeURIComponent("Email From DigiLearn");
        Linking.openURL(`mailto:${teacher.email}?subject=${subject}`);
      },
    });
  }, [teacher]);

  const openCommunityDialog = useCallback(() => {
    setCommunityDialogVisible(true);
  }, []);

  const toggleCommunityMembership = useCallback(async () => {
    if (!teacher) return;
    if (!user) {
      router.push("/login");
      return;
    }

    setCommunityActionPending(true);
    try {
      const joined = await setTeacherCommunityMembership(
        teacher.id,
        !isCommunityMember,
      );
      setCommunityMember(joined);
    } catch (err) {
      console.error("Failed to update teacher community membership:", err);
      setContactDialog({
        title: "Could not update community membership",
        message: "Please try again in a moment.",
        primaryText: "Close",
        onPrimary: () => undefined,
      });
    } finally {
      setCommunityActionPending(false);
    }
  }, [isCommunityMember, router, teacher, user]);

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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
            onPress={() => {
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/" as any);
              }
            }}
          >
            <Icon name="chevron-left" size={20} color="#ffffff" />
          </Pressable>

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
              source={
                teacher?.avatar && teacher.avatar !== failedAvatarUri
                  ? { uri: teacher.avatar }
                  : fallbackAvatar
              }
              fallbackSource={fallbackAvatar}
              placeholder={fallbackAvatar}
              onError={() => {
                if (teacher?.avatar) setFailedAvatarUri(teacher.avatar);
              }}
              style={[
                styles.avatar,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                  borderColor: accentColor,
                },
              ]}
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
              <View
                style={[styles.verifiedBadge, { backgroundColor: accentColor }]}
              >
                <Icon name="check" size={11} color="#ffffff" />
              </View>
            ) : null}
          </View>

          <Text
            style={[styles.bioText, { color: themeColors.subtitle }]}
            numberOfLines={3}
          >
            {teacher?.bio || "Teacher at DigiLearn."}
          </Text>

          {teacher?.subjects && teacher.subjects.length > 0 ? (
            <View style={styles.subjectRowWrap}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subjectChipsContainer}
              >
                {teacher.subjects.map((subj, idx) => (
                  <View
                    key={`${subj}-${idx}`}
                    style={[
                      styles.subjectPill,
                      {
                        backgroundColor: `${accentColor}14`,
                        borderColor: `${accentColor}30`,
                      },
                    ]}
                  >
                    <Icon
                      name="book-open"
                      size={11}
                      color={accentColor}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[styles.subjectPillText, { color: accentColor }]}
                    >
                      {subj}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {isOwnProfile && profile?.teacherApprovalStatus === "pending" && (
            <View
              style={[
                styles.reviewNotice,
                {
                  backgroundColor: themeColors.warningBackground,
                  borderColor: themeColors.warningBorder,
                },
              ]}
            >
              <Icon name="clock" size={16} color={themeColors.warning} />
              <Text
                style={[
                  styles.reviewNoticeText,
                  { color: themeColors.warning },
                ]}
              >
                Your teacher account is awaiting admin approval. Teacher
                features will be available once your application is approved.
              </Text>
            </View>
          )}

          {isOwnProfile &&
            profile?.teacherApprovalStatus === "rejected" &&
            profile?.allowReapply === true && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Resend teacher request"
                style={[styles.resendButton, { backgroundColor: accentColor }]}
                onPress={() =>
                  router.push("/teacher-account-quick-settings" as never)
                }
              >
                <Text style={styles.resendButtonText}>Resend request</Text>
              </Pressable>
            )}

          <View style={styles.statsRow}>
            <View
              style={[
                styles.statChip,
                { backgroundColor: themeColors.surfaceMuted },
              ]}
            >
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {formatRelativeCount(stats.pages)}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtitle }]}>
                Pages
              </Text>
            </View>
            <View
              style={[
                styles.statChip,
                { backgroundColor: themeColors.surfaceMuted },
              ]}
            >
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {formatRelativeCount(stats.books)}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtitle }]}>
                Books
              </Text>
            </View>
            <View
              style={[
                styles.statChip,
                { backgroundColor: themeColors.surfaceMuted },
              ]}
            >
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {formatRelativeCount(stats.lessons)}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtitle }]}>
                Lessons
              </Text>
            </View>
            <View
              style={[
                styles.statChip,
                { backgroundColor: themeColors.surfaceMuted },
              ]}
            >
              <Text style={[styles.statValue, { color: themeColors.text }]}>
                {formatRelativeCount(stats.announcements)}
              </Text>
              <Text style={[styles.statLabel, { color: themeColors.subtitle }]}>
                Updates
              </Text>
            </View>
          </View>

          {!isOwnProfile && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={
                isCommunityMember
                  ? "Leave teacher community"
                  : "Join teacher community"
              }
              accessibilityState={{ disabled: isCommunityActionPending }}
              disabled={isCommunityActionPending}
              style={[
                styles.communityButton,
                {
                  backgroundColor: isCommunityMember
                    ? themeColors.surfaceMuted
                    : accentColor,
                },
              ]}
              onPress={toggleCommunityMembership}
            >
              <Icon
                name={isCommunityMember ? "check" : "users"}
                size={17}
                color={isCommunityMember ? accentColor : colors.white}
                style={{ marginRight: 7 }}
              />
              <Text
                style={[
                  styles.communityButtonText,
                  { color: isCommunityMember ? accentColor : colors.white },
                ]}
              >
                {isCommunityActionPending
                  ? "Updating..."
                  : isCommunityMember
                    ? "Joined Teacher Community"
                    : "Join Teacher Community"}
              </Text>
            </Pressable>
          )}

          <View style={[styles.contactRow, { gap: actionRowGap }]}>
            {viewerRole === "own" ? (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Edit your profile"
                  style={[
                    styles.contactButton,
                    { backgroundColor: accentColor },
                  ]}
                  onPress={() => router.push("/teacher-account-quick-settings")}
                >
                  <Icon
                    name="edit-2"
                    size={16}
                    color={colors.white}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.contactButtonText}>Edit Profile</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Publish resource"
                  accessibilityState={{
                    disabled: profile?.teacherApprovalStatus !== "approved",
                  }}
                  disabled={profile?.teacherApprovalStatus !== "approved"}
                  style={[
                    styles.contactSecondaryButton,
                    {
                      borderColor:
                        profile?.teacherApprovalStatus === "approved"
                          ? accentColor
                          : themeColors.border,
                      backgroundColor:
                        profile?.teacherApprovalStatus === "approved"
                          ? `${accentColor}12`
                          : themeColors.surfaceMuted,
                    },
                  ]}
                  onPress={
                    profile?.teacherApprovalStatus === "approved"
                      ? () => router.push("/publish")
                      : undefined
                  }
                >
                  <Icon
                    name="plus-circle"
                    size={16}
                    color={
                      profile?.teacherApprovalStatus === "approved"
                        ? accentColor
                        : themeColors.inactive
                    }
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.contactSecondaryButtonText,
                      {
                        color:
                          profile?.teacherApprovalStatus === "approved"
                            ? accentColor
                            : themeColors.inactive,
                      },
                    ]}
                  >
                    Publish
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Account settings"
                  style={[
                    styles.iconButton,
                    {
                      backgroundColor: themeColors.white,
                      borderColor: themeColors.border,
                    },
                    { width: actionIconSize, height: actionIconSize },
                  ]}
                  onPress={() => router.push("/settings")}
                >
                  <Icon name="settings" size={20} color={accentColor} />
                </Pressable>
              </>
            ) : (
              <>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    viewerRole === "teacher"
                      ? "Message teacher colleague"
                      : "Contact teacher"
                  }
                  style={[
                    styles.contactButton,
                    {
                      backgroundColor: hasPhone
                        ? accentColor
                        : themeColors.border,
                    },
                  ]}
                  disabled={!hasPhone}
                  onPress={openContactSheet}
                >
                  <Icon
                    name="message-circle"
                    size={16}
                    color={colors.white}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.contactButtonText}>
                    {viewerRole === "teacher" ? "Message Colleague" : "Contact"}
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Visit teacher YouTube"
                  style={[
                    styles.iconButton,
                    !hasYoutube && styles.disabledIconButton,
                    {
                      backgroundColor: themeColors.white,
                      borderColor: themeColors.border,
                    },
                    { width: actionIconSize, height: actionIconSize },
                  ]}
                  disabled={!hasYoutube}
                  onPress={openYoutubePrompt}
                >
                  <Icon
                    name="youtube"
                    size={22}
                    color={hasYoutube ? accentColor : themeColors.inactive}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Email teacher"
                  style={[
                    styles.iconButton,
                    !hasEmail && styles.disabledIconButton,
                    {
                      backgroundColor: themeColors.white,
                      borderColor: themeColors.border,
                    },
                    { width: actionIconSize, height: actionIconSize },
                  ]}
                  disabled={!hasEmail}
                  onPress={openEmailPrompt}
                >
                  <Icon
                    name="mail"
                    size={22}
                    color={hasEmail ? accentColor : themeColors.inactive}
                  />
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Open teacher community"
                  style={[
                    styles.iconButton,
                    !hasCommunityLink && styles.disabledIconButton,
                    {
                      backgroundColor: themeColors.white,
                      borderColor: themeColors.border,
                    },
                    { width: actionIconSize, height: actionIconSize },
                  ]}
                  disabled={!hasCommunityLink}
                  onPress={openCommunityDialog}
                >
                  <Icon
                    name="users"
                    size={22}
                    color={
                      hasCommunityLink ? accentColor : themeColors.inactive
                    }
                  />
                </Pressable>
              </>
            )}
          </View>

          <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
            Resources
          </Text>

          <SearchBar
            isInput={true}
            showBack={false}
            value={search}
            onChangeText={setSearch}
            placeholder={
              isOwnProfile
                ? "Search your resources"
                : `Search ${teacher?.name?.split(" ")[0] || "teacher"}'s resources`
            }
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
            {teacherTabOptions
              .filter((tab) => tab !== "Saved" || canViewSaved)
              .map((tab) => {
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
                        { color: themeColors.subtitle },
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
      failedAvatarUri,
      fallbackAvatar,
      canViewSaved,
      openContactSheet,
      openEmailPrompt,
      openYoutubePrompt,
      router,
      search,
      themeColors.subtitle,
      stats.announcements,
      stats.books,
      stats.lessons,
      stats.pages,
      teacher,
      teacherName,
      avatarSize,
      actionIconSize,
      actionRowGap,
      isOwnProfile,
      viewerRole,
      profile?.teacherApprovalStatus,
      openCommunityDialog,
      isCommunityActionPending,
      isCommunityMember,
      toggleCommunityMembership,
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
                cover: item.image,
                book: item.book,
                createdAt: item.createdAt,
              },
            ]}
            source="pages"
            includeHiddenItems
            filterByInterests={false}
            returnTo="/teacher-profile"
            teacherId={teacher?.id || params.id || ""}
            teacherName={teacher?.name || teacherName}
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
              image: item.image ? { uri: item.image } : undefined,
            }}
            width={contentMaxWidth}
            onPress={() => {
              router.push({
                pathname: "/book-preview",
                params: {
                  id: item.id,
                  source: "teacher-profile",
                  returnTo: "/teacher-profile",
                  teacherId: teacher?.id || params.id || "",
                  teacherName: teacher?.name || teacherName,
                },
              } as any);
            }}
          />
        );
      }

      if (
        item.type === "announcement" ||
        item.type === "image" ||
        item.type === "pdf"
      ) {
        return (
          <TeacherPostItem
            postItem={{
              id: item.id,
              title: item.title,
              teacher: item.teacher || teacher?.name || teacherName,
              owner: item.teacher || teacher?.name || teacherName,
              ownerType: item.ownerType,
              subject: item.subject,
              description: item.description,
              hasCover:
                typeof item.hasCover === "boolean"
                  ? item.hasCover
                  : item.hasCover === "true",
              cover: item.image,
              document: item.document,
              fileType: item.fileType,
              createdAt:
                typeof item.createdAt === "number"
                  ? new Date(item.createdAt)
                  : typeof item.createdAt === "string"
                    ? new Date(item.createdAt)
                    : null,
            }}
            teacherAvatars={
              teacher?.avatar && teacher?.name
                ? { [teacher.name]: teacher.avatar }
                : {}
            }
          />
        );
      }

      return (
        <VideoCard
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
      <SafeAreaView
        style={[styles.safeArea, { backgroundColor: themeColors.background }]}
      >
        <Animated.View
          entering={FadeInUp.duration(420)}
          style={[
            styles.container,
            { maxWidth: contentMaxWidth, paddingHorizontal: horizontalPadding },
          ]}
        >
          <FlatList
            data={["one", "two", "three"]}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.resourceList}
            ListHeaderComponent={
              <>
                <View style={styles.headerWrap}>
                  <RNAnimated.View
                    style={[
                      styles.skeletonHeaderPanel,
                      { backgroundColor: themeColors.surface },
                      { opacity: pulseAnim },
                    ]}
                  />
                  <RNAnimated.View
                    style={[
                      styles.skeletonBackButton,
                      { backgroundColor: themeColors.surfaceMuted },
                      { opacity: pulseAnim },
                    ]}
                  />
                  {isOwnProfile && (
                    <RNAnimated.View
                      style={[
                        styles.skeletonSettingsButton,
                        { backgroundColor: themeColors.surfaceMuted },
                        { opacity: pulseAnim },
                      ]}
                    />
                  )}
                  <View style={styles.avatarShell}>
                    <RNAnimated.View
                      style={[
                        styles.skeletonAvatar,
                        { backgroundColor: themeColors.surfaceMuted },
                        {
                          width: avatarSize,
                          height: avatarSize,
                          borderRadius: avatarSize / 2,
                          opacity: pulseAnim,
                        },
                      ]}
                    />
                  </View>
                </View>

                <View style={styles.profileBody}>
                  <RNAnimated.View
                    style={[
                      styles.skeletonTitle,
                      { backgroundColor: themeColors.surfaceMuted },
                      { opacity: pulseAnim },
                    ]}
                  />
                  <RNAnimated.View
                    style={[
                      styles.skeletonBio,
                      { backgroundColor: themeColors.surfaceMuted },
                      { opacity: pulseAnim },
                    ]}
                  />
                  <View style={styles.statsRow}>
                    {Array.from({ length: 4 }, (_, index) => (
                      <RNAnimated.View
                        key={index}
                        style={[
                          styles.skeletonStatChip,
                          { opacity: pulseAnim },
                        ]}
                      />
                    ))}
                  </View>
                  <View style={[styles.contactRow, { gap: actionRowGap }]}>
                    <RNAnimated.View
                      style={[
                        styles.skeletonContactButton,
                        { opacity: pulseAnim },
                      ]}
                    />
                    {Array.from({ length: 3 }, (_, index) => (
                      <RNAnimated.View
                        key={index}
                        style={[
                          styles.skeletonIconButton,
                          {
                            width: actionIconSize,
                            height: actionIconSize,
                            opacity: pulseAnim,
                          },
                        ]}
                      />
                    ))}
                  </View>
                  <RNAnimated.View
                    style={[
                      styles.skeletonSectionTitle,
                      { opacity: pulseAnim },
                    ]}
                  />
                  <RNAnimated.View
                    style={[styles.skeletonSearch, { opacity: pulseAnim }]}
                  />
                  <View style={styles.tabRow}>
                    {Array.from({ length: 4 }, (_, index) => (
                      <RNAnimated.View
                        key={index}
                        style={[styles.skeletonTab, { opacity: pulseAnim }]}
                      />
                    ))}
                  </View>
                </View>
              </>
            }
            renderItem={() => (
              <RNAnimated.View
                style={[styles.skeletonResource, { opacity: pulseAnim }]}
              />
            )}
          />
        </Animated.View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <Animated.View
        entering={FadeInUp.duration(420)}
        style={[
          styles.container,
          {
            maxWidth: contentMaxWidth,
            paddingHorizontal: horizontalPadding,
            backgroundColor: themeColors.background,
          },
        ]}
      >
        <FlatList
          data={filteredResources}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.resourceList,
            { backgroundColor: themeColors.background },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={accentColor}
            />
          }
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={() =>
            activeTab === "Saved" && canViewSaved ? (
              <SavedResources profile={profile} signedIn />
            ) : (
              <View
                style={[
                  styles.emptyState,
                  {
                    backgroundColor: themeColors.surface,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Icon name="inbox" size={38} color={accentColor} />
                <Text
                  style={[styles.emptyText, { color: themeColors.subtitle }]}
                >
                  {errorMessage ||
                    "No matching resources found for this teacher."}
                </Text>
              </View>
            )
          }
          renderItem={renderResourceCard}
        />
        <ActionDialog
          visible={Boolean(contactDialog)}
          title={contactDialog?.title ?? "Continue"}
          message={contactDialog?.message ?? ""}
          primaryText={contactDialog?.primaryText ?? "Continue"}
          secondaryText={contactDialog?.secondaryText}
          onPrimary={() => {
            const onPrimary = contactDialog?.onPrimary;
            setContactDialog(null);
            onPrimary?.();
          }}
          onSecondary={() => {
            const onSecondary = contactDialog?.onSecondary;
            setContactDialog(null);
            onSecondary?.();
          }}
          onClose={() => setContactDialog(null)}
        />
        <ActionDialog
          visible={isCommunityDialogVisible}
          icon={<Icon name="users" size={24} color="#2563EB" />}
          title={`Join ${teacherFirstName}'s Community?`}
          message={`You're about to leave DigiLearn and open ${teacherFirstName}'s WhatsApp community channel. Would you like to continue?`}
          primaryText="Continue"
          secondaryText="Cancel"
          onPrimary={() => {
            setCommunityDialogVisible(false);
            if (teacher?.phone) {
              const message = `Hello Teacher ${teacherFirstName}, I would like to join your DigiLearn learning community.`;
              Linking.openURL(
                `https://wa.me/${teacher.phone}?text=${encodeURIComponent(message)}`,
              );
            } else if (teacher?.youtube) {
              Linking.openURL(teacher.youtube);
            }
          }}
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
    borderRadius: 999,
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
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bioText: {
    marginTop: spacing.sm,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: spacing.xl,
  },
  subjectRowWrap: {
    marginTop: spacing.sm,
    width: "100%",
  },
  subjectChipsContainer: {
    paddingHorizontal: spacing.md,
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  subjectPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  subjectPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  reviewNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  reviewNoticeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
  },
  resendButton: {
    alignSelf: "flex-start",
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  resendButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
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
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  contactButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "600",
  },
  communityButton: {
    minHeight: 48,
    marginTop: spacing.md,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.md,
  },
  communityButtonText: {
    fontSize: 15,
    fontWeight: "700",
  },
  contactSecondaryButton: {
    flex: 1,
    height: 52,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
  },
  contactSecondaryButtonText: {
    fontSize: 15,
    fontWeight: "700",
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
  disabledIconButton: {
    borderColor: "#D1D5DB",
    backgroundColor: "#E5E7EB",
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
    borderRadius: 16,
    borderWidth: 1,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: spacing.xl,
  },
  skeletonHeaderPanel: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    backgroundColor: "#E5E7EB",
  },
  skeletonBackButton: {
    position: "absolute",
    top: 12,
    left: 12,
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: "#D1D5DB",
  },
  skeletonSettingsButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#D1D5DB",
  },
  skeletonAvatar: {
    width: 150,
    height: 150,
    borderRadius: 100,
    backgroundColor: "#D1D5DB",
  },
  skeletonTitle: {
    alignSelf: "center",
    width: 180,
    height: 34,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  skeletonBio: {
    alignSelf: "center",
    width: "72%",
    height: 40,
    marginTop: spacing.sm,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  skeletonStatChip: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },
  skeletonContactButton: {
    flex: 1,
    height: 52,
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  skeletonIconButton: {
    borderRadius: 10,
    backgroundColor: "#E5E7EB",
  },
  skeletonSectionTitle: {
    width: 130,
    height: 30,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  skeletonSearch: {
    width: "100%",
    height: 52,
    marginVertical: spacing.lg,
    borderRadius: 28,
    backgroundColor: "#E5E7EB",
  },
  skeletonTab: {
    width: 72,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: "#E5E7EB",
  },
  skeletonResource: {
    width: "100%",
    height: 190,
    borderRadius: 16,
    backgroundColor: "#E5E7EB",
  },
});
