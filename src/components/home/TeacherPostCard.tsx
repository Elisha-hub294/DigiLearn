import { FirebaseImage as Image } from "@/components/ui/FirebaseImage";
import { Feather as Icon, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  updateDoc,
} from "firebase/firestore";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextStyle,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { db } from "../../../firebaseConfig";
import { radius, spacing, colors as staticColors } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";
import { recordUserActivity } from "../../services/activityService";
import { toggleSavedItem } from "../../services/userProfile";
import { openGoogleMeetSession } from "../../utils/googleMeet";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../../utils/interestFilter";
import { feedbackMessages, showNativeToast } from "../../utils/nativeToast";
import { ActionDialog } from "../ui/ActionDialog";
import { ResourceDeleteMenu } from "../ui/ResourceDeleteMenu";
import { Skeleton } from "../ui/Skeleton";

export type TeacherPost = {
  id: string;
  title?: string;
  teacher?: string;
  owner?: string;
  ownerType?: string;
  subject?: string;
  description?: string;
  hasCover?: boolean;
  cover?: string;
  images?: string[];
  createdAt?: Date | null;
  document?: string;
  fileType?: "image" | "doc" | "";
  postType?: "live" | "announcement" | "post";
  type?: string;
  meetCode?: string;
  meetUrl?: string;
  isLive?: boolean;
  status?: "live" | "ended";
};

const GradientTitle = ({
  text,
  style,
}: {
  text: string;
  style?: TextStyle;
}) => {
  if (Platform.OS === "web") {
    return (
      <Text style={[style, styles.webGradientTitle as TextStyle]}>{text}</Text>
    );
  }

  return (
    <MaskedView
      style={styles.gradientTitleMask}
      maskElement={
        <Text style={[style, { backgroundColor: "transparent" }]}>{text}</Text>
      }
    >
      <LinearGradient
        style={styles.gradientTitleGradient}
        colors={[staticColors.primary, "#c224f0", "#ff002b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[style, styles.gradientTitleText]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

const getRelativeTime = (date: Date | null | undefined): string => {
  if (!date) return "Recently shared";
  const now = Date.now();
  const diffMs = now - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return "Recently shared";

  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60)
    return diffMin === 1 ? "1 minute ago" : `${diffMin} minutes ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return diffHr === 1 ? "1 hour ago" : `${diffHr} hours ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return diffDay === 1 ? "Yesterday" : `${diffDay} days ago`;
  const diffWk = Math.floor(diffDay / 7);
  if (diffWk < 5) return diffWk === 1 ? "1 week ago" : `${diffWk} weeks ago`;
  const diffMo = Math.floor(diffDay / 30);
  if (diffMo < 12) return diffMo === 1 ? "1 month ago" : `${diffMo} months ago`;
  const diffYr = Math.floor(diffDay / 365);
  return diffYr === 1 ? "1 year ago" : `${diffYr} years ago`;
};

export const normalizeTeacherPost = (doc: {
  id: string;
  data: () => Record<string, unknown>;
}) => {
  const data = doc.data();

  const title = typeof data.title === "string" ? data.title : undefined;

  const teacher =
    typeof data.teacher === "string"
      ? data.teacher
      : typeof data.teacherName === "string"
        ? data.teacherName
        : "Teacher";

  const subject =
    typeof data.subject === "string"
      ? data.subject
      : typeof data.subjectName === "string"
        ? data.subjectName
        : "Physics";

  const description =
    typeof data.description === "string"
      ? data.description
      : typeof data.descriprion === "string"
        ? data.descriprion
        : typeof data.content === "string"
          ? data.content
          : typeof data.message === "string"
            ? data.message
            : undefined;

  const cover = typeof data.cover === "string" ? data.cover : undefined;
  const hasCover =
    typeof data.hasCover === "boolean" ? data.hasCover : Boolean(cover);
  const owner = typeof data.owner === "string" ? data.owner : undefined;
  const ownerType =
    typeof data.ownerType === "string" ? data.ownerType : undefined;
  const fileType =
    data.fileType === "image" || data.fileType === "doc" ? data.fileType : "";

  const document =
    typeof data.document === "string" ? data.document : undefined;

  const rawCreatedAt = data.createdAt;
  let createdAt: Date | null = null;
  if (rawCreatedAt && typeof (rawCreatedAt as any).toDate === "function") {
    createdAt = (rawCreatedAt as any).toDate() as Date;
  } else if (rawCreatedAt instanceof Date) {
    createdAt = rawCreatedAt;
  } else if (typeof rawCreatedAt === "number") {
    createdAt = new Date(rawCreatedAt);
  } else if (typeof rawCreatedAt === "string") {
    const parsed = new Date(rawCreatedAt);
    if (!isNaN(parsed.getTime())) createdAt = parsed;
  }

  const rawImages = Array.isArray(data.images)
    ? (data.images.filter(
        (img: unknown): img is string =>
          typeof img === "string" && img.trim().length > 0,
      ) as string[])
    : [];
  const images =
    rawImages.length > 0
      ? rawImages
      : cover && fileType !== "doc"
        ? [cover]
        : [];

  const postType =
    typeof data.postType === "string"
      ? (data.postType as "live" | "announcement" | "post")
      : typeof data.type === "string" && data.type === "live"
        ? "live"
        : undefined;

  const meetCode =
    typeof data.meetCode === "string" ? data.meetCode : undefined;
  const meetUrl = typeof data.meetUrl === "string" ? data.meetUrl : undefined;
  const isLive =
    typeof data.isLive === "boolean"
      ? data.isLive
      : postType === "live" || Boolean(meetCode || meetUrl);
  const status =
    data.status === "ended"
      ? ("ended" as const)
      : isLive
        ? ("live" as const)
        : undefined;

  return {
    id: doc.id,
    title,
    teacher,
    owner,
    ownerType,
    subject,
    description,
    hasCover,
    cover,
    images,
    document,
    fileType,
    postType,
    type: typeof data.type === "string" ? data.type : postType,
    meetCode,
    meetUrl,
    isLive,
    status,
    createdAt,
  } satisfies TeacherPost;
};

const teacherPostCollections = [
  "teacherPosts",
  "teacherPostsCards",
  "teacherUpdates",
];

export async function loadTeacherMetadata(): Promise<{
  teacherAvatars: Record<string, string>;
  ownerProfiles: Record<string, { name: string; avatar?: string }>;
  defaultUserAvatar: string | null;
}> {
  let defaultUserAvatar: string | null = null;
  const avatarMap: Record<string, string> = {};
  const profiles: Record<string, { name: string; avatar?: string }> = {};

  try {
    const [defaultSnap, teachersSnap] = await Promise.all([
      getDocs(collection(db, "default")),
      getDocs(collection(db, "teachers")),
    ]);

    defaultSnap.docs.forEach((doc) => {
      const data = doc.data();
      if (data.name === "user" && typeof data.icon === "string") {
        defaultUserAvatar = data.icon;
      }
    });

    teachersSnap.docs.forEach((doc) => {
      const data = doc.data();
      const name = typeof data.name === "string" ? data.name : "Teacher";
      const avatar = typeof data.avatar === "string" ? data.avatar : undefined;
      avatarMap[name] = avatar || "";
      profiles[doc.id] = { name, avatar };
      if (typeof data.name === "string" && typeof data.avatar === "string") {
        avatarMap[data.name] = data.avatar;
      }
    });
  } catch (err) {
    console.warn("Could not fetch teacher metadata", err);
  }

  return {
    teacherAvatars: avatarMap,
    ownerProfiles: profiles,
    defaultUserAvatar,
  };
}

export async function loadTeacherPosts(): Promise<TeacherPost[]> {
  for (const collectionName of teacherPostCollections) {
    try {
      const postsRef = collection(db, collectionName);
      const postsQuery = query(postsRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(postsQuery);
      const fetchedPosts = snapshot.docs.map((doc) =>
        normalizeTeacherPost(doc),
      );
      if (fetchedPosts.length > 0) {
        return fetchedPosts;
      }
    } catch (queryError) {
      console.warn(
        `Teacher post collection ${collectionName} unavailable`,
        queryError,
      );
    }
  }
  return [];
}

export const TeacherPostCard = ({
  posts: providedPosts,
}: {
  posts?: TeacherPost[];
} = {}) => {
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const isWide = width >= 900;
  const [posts, setPosts] = useState<TeacherPost[]>(providedPosts ?? []);
  const [loading, setLoading] = useState(!providedPosts);

  // Database assets states
  const [teacherAvatars, setTeacherAvatars] = useState<Record<string, string>>(
    {},
  );
  const [ownerProfiles, setOwnerProfiles] = useState<
    Record<string, { name: string; avatar?: string }>
  >({});
  const [defaultUserAvatar, setDefaultUserAvatar] = useState<string | null>(
    null,
  );
  const [visiblePostIds, setVisiblePostIds] = useState<Set<string>>(
    () => new Set(),
  );
  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 1 }),
    [],
  );
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setVisiblePostIds(
        new Set(
          viewableItems
            .map((token) => (token.item as TeacherPost | undefined)?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      );
    },
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const loadAll = async () => {
      const metadata = await loadTeacherMetadata();
      if (!isMounted) return;
      setTeacherAvatars(metadata.teacherAvatars);
      setOwnerProfiles(metadata.ownerProfiles);
      setDefaultUserAvatar(metadata.defaultUserAvatar);

      if (providedPosts) {
        setPosts(providedPosts);
        setLoading(false);
        return;
      }

      const fetched = await loadTeacherPosts();
      if (!isMounted) return;
      setPosts(fetched);
      setLoading(false);
    };

    loadAll();

    return () => {
      isMounted = false;
    };
  }, [providedPosts]);

  const displayedPosts = useMemo(() => {
    if (!shouldFilterByInterests(profile)) return posts;
    return posts.filter((post) =>
      matchesUserInterests(post.subject, profile?.subjects),
    );
  }, [posts, profile]);

  if (loading) {
    return (
      <View style={styles.list}>
        {[0, 1].map((i) => (
          <SkeletonTeacherPostCard key={i} />
        ))}
      </View>
    );
  }

  const renderPostItem = useCallback(
    ({ item: postItem, index }: { item: TeacherPost; index: number }) => (
      <TeacherPostItem
        postItem={postItem}
        index={index}
        isWide={isWide}
        teacherAvatars={teacherAvatars}
        ownerProfiles={ownerProfiles}
        defaultUserAvatar={defaultUserAvatar}
        isVisible={visiblePostIds.has(postItem.id)}
      />
    ),
    [defaultUserAvatar, isWide, ownerProfiles, teacherAvatars, visiblePostIds],
  );

  if (displayedPosts.length === 0) {
    return null;
  }

  return (
    <FlatList
      data={displayedPosts}
      keyExtractor={(item) => item.id}
      style={styles.list}
      scrollEnabled={false}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      renderItem={renderPostItem}
    />
  );
};

function MultiImageLayout({
  images,
  onImagePress,
  onSeeAllPress,
}: {
  images: string[];
  onImagePress: (index: number) => void;
  onSeeAllPress: () => void;
}) {
  const count = images.length;
  if (count === 0) return null;

  return (
    <View style={layoutStyles.container}>
      {/* Floating "+" / "See all" button */}
      {count > 1 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Open all ${count} photos in see-all screen`}
          style={layoutStyles.plusBadgeButton}
          onPress={onSeeAllPress}
        >
          <Icon name="plus" size={13} color="#ffffff" />
          <Text style={layoutStyles.plusBadgeText}>{count}</Text>
        </Pressable>
      )}

      {/* 1 Image */}
      {count === 1 && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open image preview"
          style={layoutStyles.singleWrapper}
          onPress={() => onImagePress(0)}
        >
          <Image
            source={{ uri: images[0] }}
            style={layoutStyles.fullImage}
            contentFit="cover"
          />
        </Pressable>
      )}

      {/* 2 Images */}
      {count === 2 && (
        <View style={layoutStyles.row2}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open photo 1"
            style={layoutStyles.halfCell}
            onPress={() => onImagePress(0)}
          >
            <Image
              source={{ uri: images[0] }}
              style={layoutStyles.fullImage}
              contentFit="cover"
            />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open photo 2"
            style={layoutStyles.halfCell}
            onPress={() => onImagePress(1)}
          >
            <Image
              source={{ uri: images[1] }}
              style={layoutStyles.fullImage}
              contentFit="cover"
            />
          </Pressable>
        </View>
      )}

      {/* 3 Images: 1 large left, 2 stacked right */}
      {count === 3 && (
        <View style={layoutStyles.row3}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open photo 1"
            style={layoutStyles.threeLeftCell}
            onPress={() => onImagePress(0)}
          >
            <Image
              source={{ uri: images[0] }}
              style={layoutStyles.fullImage}
              contentFit="cover"
            />
          </Pressable>
          <View style={layoutStyles.threeRightCol}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open photo 2"
              style={layoutStyles.threeSubCell}
              onPress={() => onImagePress(1)}
            >
              <Image
                source={{ uri: images[1] }}
                style={layoutStyles.fullImage}
                contentFit="cover"
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open photo 3"
              style={layoutStyles.threeSubCell}
              onPress={() => onImagePress(2)}
            >
              <Image
                source={{ uri: images[2] }}
                style={layoutStyles.fullImage}
                contentFit="cover"
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* 4 Images: 2x2 grid */}
      {count === 4 && (
        <View style={layoutStyles.grid2x2}>
          <View style={layoutStyles.gridRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open photo 1"
              style={layoutStyles.quarterCell}
              onPress={() => onImagePress(0)}
            >
              <Image
                source={{ uri: images[0] }}
                style={layoutStyles.fullImage}
                contentFit="cover"
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open photo 2"
              style={layoutStyles.quarterCell}
              onPress={() => onImagePress(1)}
            >
              <Image
                source={{ uri: images[1] }}
                style={layoutStyles.fullImage}
                contentFit="cover"
              />
            </Pressable>
          </View>
          <View style={layoutStyles.gridRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open photo 3"
              style={layoutStyles.quarterCell}
              onPress={() => onImagePress(2)}
            >
              <Image
                source={{ uri: images[2] }}
                style={layoutStyles.fullImage}
                contentFit="cover"
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open photo 4"
              style={layoutStyles.quarterCell}
              onPress={() => onImagePress(3)}
            >
              <Image
                source={{ uri: images[3] }}
                style={layoutStyles.fullImage}
                contentFit="cover"
              />
            </Pressable>
          </View>
        </View>
      )}

      {/* 5+ Images: 2x2 grid with +N on the 4th item */}
      {count >= 5 && (
        <View style={layoutStyles.grid2x2}>
          <View style={layoutStyles.gridRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open photo 1"
              style={layoutStyles.quarterCell}
              onPress={() => onImagePress(0)}
            >
              <Image
                source={{ uri: images[0] }}
                style={layoutStyles.fullImage}
                contentFit="cover"
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open photo 2"
              style={layoutStyles.quarterCell}
              onPress={() => onImagePress(1)}
            >
              <Image
                source={{ uri: images[1] }}
                style={layoutStyles.fullImage}
                contentFit="cover"
              />
            </Pressable>
          </View>
          <View style={layoutStyles.gridRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open photo 3"
              style={layoutStyles.quarterCell}
              onPress={() => onImagePress(2)}
            >
              <Image
                source={{ uri: images[2] }}
                style={layoutStyles.fullImage}
                contentFit="cover"
              />
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`View all ${count} photos in see-all screen`}
              style={layoutStyles.quarterCell}
              onPress={onSeeAllPress}
            >
              <Image
                source={{ uri: images[3] }}
                style={layoutStyles.fullImage}
                contentFit="cover"
              />
              <View style={layoutStyles.moreOverlay}>
                <Text style={layoutStyles.moreOverlayPlus}>+{count - 3}</Text>
                <Text style={layoutStyles.moreOverlayLabel}>See all</Text>
              </View>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

export const TeacherPostItem = memo(function TeacherPostItem({
  postItem,
  index = 0,
  isWide = false,
  teacherAvatars = {},
  ownerProfiles = {},
  defaultUserAvatar = null,
  isVisible = true,
  disableTeacherProfileNavigation = false,
}: {
  postItem: TeacherPost;
  index?: number;
  isWide?: boolean;
  teacherAvatars?: Record<string, string>;
  ownerProfiles?: Record<string, { name: string; avatar?: string }>;
  defaultUserAvatar?: string | null;
  isVisible?: boolean;
  disableTeacherProfileNavigation?: boolean;
}) {
  const { user, profile } = useProfile();
  const { colors } = useTheme();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [showGuestSaveDialog, setShowGuestSaveDialog] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [activePreviewIndex, setActivePreviewIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const [localStatus, setLocalStatus] = useState<"live" | "ended" | undefined>(
    postItem.status,
  );
  const [isEndingSession, setIsEndingSession] = useState(false);

  const isLivePost =
    postItem.postType === "live" ||
    postItem.type === "live" ||
    Boolean(postItem.meetCode) ||
    Boolean(postItem.meetUrl);

  const isEnded = localStatus === "ended" || postItem.status === "ended";
  const isHost = Boolean(user && postItem.owner === user.uid);

  const handleJoinLiveSession = async () => {
    const target = postItem.meetUrl || postItem.meetCode;
    if (!target) return;
    if (user?.uid) {
      void recordUserActivity(user.uid, "lesson", postItem.id);
    }
    showNativeToast("Opening Google Meet...");
    await openGoogleMeetSession(target);
  };

  const handleCopyMeetCode = async () => {
    if (!postItem.meetCode) return;
    await Clipboard.setStringAsync(postItem.meetCode);
    showNativeToast(`Meeting code copied: ${postItem.meetCode}`);
  };

  const handleEndLiveSession = async () => {
    if (isEndingSession) return;
    setIsEndingSession(true);
    try {
      await updateDoc(doc(db, "teacherPosts", postItem.id), {
        status: "ended",
        isLive: false,
      });
      setLocalStatus("ended");
      showNativeToast("Live session ended.");
    } catch (err) {
      console.error("Failed to end live session:", err);
      showNativeToast("Could not end live session.");
    } finally {
      setIsEndingSession(false);
    }
  };

  const ownerProfile = postItem.owner
    ? ownerProfiles[postItem.owner]
    : undefined;
  const rawTeacherName = ownerProfile?.name || postItem.teacher || "Teacher";
  const teacherName = `Tr. ${rawTeacherName}`;
  const description =
    postItem.description ?? "No teacher update available yet.";
  const title = postItem.title || "Teacher update";
  const hideOwner = postItem.ownerType?.trim().toLowerCase() === "admin";

  const postImages = useMemo(() => {
    if (postItem.images && postItem.images.length > 0) {
      return postItem.images;
    }
    if (postItem.cover && postItem.fileType !== "doc") {
      return [postItem.cover];
    }
    return [];
  }, [postItem.images, postItem.cover, postItem.fileType]);

  const handleOpenSeeAll = (initialIndex: number = 0) => {
    router.push({
      pathname: "/see-all",
      params: {
        type: "post-images",
        title: postItem.title || `${teacherName}'s Photos`,
        images: JSON.stringify(postImages),
        initialIndex: String(initialIndex),
      },
    } as never);
  };

  const handleImagePress = (imageIndex: number) => {
    setActivePreviewIndex(imageIndex);
    setShowImagePreview(true);
  };

  const handlePreviewPress = () => {
    if (postItem.fileType === "doc" && postItem.document) {
      router.push({
        pathname: "/pdf-reader",
        params: {
          uri: encodeURIComponent(postItem.document),
          title,
        },
      } as never);
      return;
    }

    if (postItem.fileType === "image" || postImages.length > 0) {
      handleImagePress(0);
    }
  };

  const isSaved = Boolean(
    user && profile?.["saved-posts"]?.includes(postItem.id),
  );

  const handleToggleSave = async () => {
    if (!user) {
      setShowGuestSaveDialog(true);
      return;
    }
    try {
      await toggleSavedItem(user.uid, "saved-posts", postItem.id, isSaved);
      showNativeToast(
        isSaved ? feedbackMessages.itemUnsaved : feedbackMessages.itemSaved,
      );
    } catch (err) {
      console.error("Failed to toggle saved teacher post:", err);
    }
  };

  // Resolve Teacher Avatar from DB or Fallback
  const resolvedAvatar =
    ownerProfile?.avatar ||
    (postItem.teacher && teacherAvatars[postItem.teacher]) ||
    defaultUserAvatar ||
    "TeacherProfile/tr-default.png";

  return (
    <Animated.View
      entering={FadeInUp.duration(500 + index * 80)}
      pointerEvents={isDeleting ? "none" : "auto"}
      style={{ width: "100%" }}
    >
      <Pressable
        {...({
          onHoverIn: () => setIsHovered(true),
          onHoverOut: () => setIsHovered(false),
        } as any)}
        style={({ pressed, hovered }: any) => [
          styles.card,
          { backgroundColor: colors.white },
          (pressed || hovered || isHovered) && {
            backgroundColor: colors.lightBackground,
          },
        ]}
      >
        <View style={styles.menu}>
          <ResourceDeleteMenu
            collection="teacherPosts"
            id={postItem.id}
            title={title}
            data={{
              owner: postItem.owner,
              cover: postItem.cover,
              document: postItem.document,
            }}
            onDeleting={() => setIsDeleting(true)}
            light
          />
        </View>

        {/* Document preview */}
        {!isLivePost &&
        postItem.fileType === "doc" &&
        postItem.document &&
        postItem.cover ? (
          <Pressable
            {...({
              onHoverIn: () => setIsHovered(true),
              onHoverOut: () => setIsHovered(false),
            } as any)}
            style={styles.previewWrap}
            onPress={handlePreviewPress}
            accessibilityRole="button"
            accessibilityLabel="Open PDF"
          >
            <Image
              source={{ uri: postItem.cover }}
              style={styles.preview}
              contentFit="cover"
            />
            <View style={[styles.previewOverlay, { pointerEvents: "none" }]} />
          </Pressable>
        ) : null}

        {/* Multi-image photo layout */}
        {!isLivePost && postItem.fileType !== "doc" && postImages.length > 0 ? (
          <MultiImageLayout
            images={postImages}
            onImagePress={handleImagePress}
            onSeeAllPress={() => handleOpenSeeAll(0)}
          />
        ) : null}

        {/* Dedicated Live Google Meet Session Card */}
        {isLivePost ? (
          <View style={styles.liveCardContainer}>
            <View style={styles.liveCardBannerWrap}>
              <Image
                source={{
                  uri:
                    postItem.cover ||
                    (postImages.length > 0
                      ? postImages[0]
                      : "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80"),
                }}
                style={styles.liveCardBannerImage}
                contentFit="cover"
              />
              <LinearGradient
                colors={["rgba(15, 23, 42, 0.45)", "rgba(15, 23, 42, 0.94)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.liveBannerBadgeRow}>
                <View
                  style={[
                    styles.liveStatusPill,
                    isEnded && styles.endedStatusPill,
                  ]}
                >
                  {!isEnded && <View style={styles.liveStatusDot} />}
                  <Text style={styles.liveStatusPillText}>
                    {isEnded ? "SESSION ENDED" : "GOOGLE MEET LIVE"}
                  </Text>
                </View>
                {postItem.subject ? (
                  <View style={styles.liveSubjectPill}>
                    <Text style={styles.liveSubjectText}>
                      {postItem.subject}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* Coordinates & Code section */}
              {postItem.meetCode ? (
                <View style={styles.liveCoordsRow}>
                  <View style={styles.meetIconShell}>
                    <Icon name="video" size={16} color="#FFFFFF" />
                  </View>
                  <View style={styles.liveCoordsInfo}>
                    <Text style={styles.liveCoordsLabel}>Meeting Code</Text>
                    <Text style={styles.liveCoordsValue}>
                      {postItem.meetCode}
                    </Text>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Copy meeting code"
                    onPress={handleCopyMeetCode}
                    style={styles.copyCodeButton}
                  >
                    <Icon name="copy" size={13} color="#FFFFFF" />
                    <Text style={styles.copyCodeText}>Copy</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Join Live Session Action Button */}
              {!isEnded ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Join live session on Google Meet"
                  onPress={handleJoinLiveSession}
                  style={({ pressed }: any) => [
                    styles.joinLiveButton,
                    pressed && {
                      opacity: 0.92,
                      transform: [{ scale: 0.99 }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={["#EA4335", "#D93025"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.joinLiveGradient}
                  >
                    <Icon name="video" size={18} color="#FFFFFF" />
                    <Text style={styles.joinLiveButtonText}>
                      Join Live Session
                    </Text>
                    <Icon name="arrow-up-right" size={16} color="#FFFFFF" />
                  </LinearGradient>
                </Pressable>
              ) : (
                <View style={styles.endedBannerNotice}>
                  <Icon name="check-circle" size={15} color="#94A3B8" />
                  <Text style={styles.endedBannerNoticeText}>
                    This live session has concluded
                  </Text>
                </View>
              )}
            </View>

            {/* Host Controls */}
            {isHost && !isEnded ? (
              <View
                style={[
                  styles.hostControlsBar,
                  { backgroundColor: colors.lightBackground },
                ]}
              >
                <Text style={[styles.hostNotice, { color: colors.subtitle }]}>
                  You are the host of this live session
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="End live session"
                  onPress={handleEndLiveSession}
                  disabled={isEndingSession}
                  style={styles.endSessionButton}
                >
                  <Icon name="slash" size={12} color="#EF4444" />
                  <Text style={styles.endSessionButtonText}>
                    {isEndingSession ? "Ending..." : "End Session"}
                  </Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        <Modal
          visible={showImagePreview}
          transparent
          animationType="fade"
          onRequestClose={() => setShowImagePreview(false)}
        >
          <View style={styles.imagePreviewBackdrop}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setShowImagePreview(false)}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close image preview"
              style={styles.closePreviewButton}
              onPress={() => setShowImagePreview(false)}
            >
              <Icon name="x" size={24} color={staticColors.white} />
            </Pressable>

            {/* Quick action to open full see-all screen */}
            {postImages.length > 1 && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Open in see-all screen"
                style={layoutStyles.modalSeeAllButton}
                onPress={() => {
                  setShowImagePreview(false);
                  handleOpenSeeAll(activePreviewIndex);
                }}
              >
                <Icon name="grid" size={15} color="#ffffff" />
                <Text style={layoutStyles.modalSeeAllText}>
                  See all ({postImages.length})
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.fullImagePreviewFrame}
              onPress={(event) => event.stopPropagation()}
            >
              <Image
                source={{
                  uri: postImages[activePreviewIndex] || postItem.cover,
                }}
                style={styles.fullImagePreview}
                contentFit="contain"
              />
            </Pressable>

            {/* Next / Prev navigation in modal if multiple images */}
            {postImages.length > 1 && (
              <View style={layoutStyles.modalNavRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Previous image"
                  disabled={activePreviewIndex === 0}
                  style={[
                    layoutStyles.modalNavButton,
                    activePreviewIndex === 0 && { opacity: 0.3 },
                  ]}
                  onPress={() =>
                    setActivePreviewIndex((prev) => Math.max(0, prev - 1))
                  }
                >
                  <Icon name="chevron-left" size={22} color="#ffffff" />
                </Pressable>
                <Text style={layoutStyles.modalCounterText}>
                  {activePreviewIndex + 1} / {postImages.length}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Next image"
                  disabled={activePreviewIndex === postImages.length - 1}
                  style={[
                    layoutStyles.modalNavButton,
                    activePreviewIndex === postImages.length - 1 && {
                      opacity: 0.3,
                    },
                  ]}
                  onPress={() =>
                    setActivePreviewIndex((prev) =>
                      Math.min(postImages.length - 1, prev + 1),
                    )
                  }
                >
                  <Icon name="chevron-right" size={22} color="#ffffff" />
                </Pressable>
              </View>
            )}
          </View>
        </Modal>

        <View style={styles.header}>
          {!hideOwner && (
            <View style={styles.profileRow}>
              <Pressable
                accessibilityRole={
                  disableTeacherProfileNavigation ? undefined : "button"
                }
                accessibilityLabel={`Open teacher profile: ${rawTeacherName}`}
                onPress={
                  disableTeacherProfileNavigation
                    ? undefined
                    : () =>
                        router.push({
                          pathname: "/teacher-profile",
                          params: { id: postItem.owner, name: rawTeacherName },
                        } as never)
                }
              >
                <Image
                  source={{ uri: resolvedAvatar }}
                  style={styles.avatar}
                  contentFit="cover"
                />
              </Pressable>
              <Pressable
                accessibilityRole={
                  disableTeacherProfileNavigation ? undefined : "button"
                }
                accessibilityLabel={`Open teacher profile: ${rawTeacherName}`}
                onPress={
                  disableTeacherProfileNavigation
                    ? undefined
                    : () =>
                        router.push({
                          pathname: "/teacher-profile",
                          params: { id: postItem.owner, name: rawTeacherName },
                        } as never)
                }
              >
                <View>
                  <View style={styles.nameRow}>
                    <Text
                      style={[styles.name, { color: colors.text }]}
                      maxFontSizeMultiplier={1.3}
                    >
                      {teacherName}
                    </Text>
                    {isLivePost ? (
                      <View style={styles.headerLiveWrap}>
                        {!isEnded ? (
                          <View style={styles.headerLiveBadge}>
                            <View style={styles.headerLiveDot} />
                            <Text style={styles.headerLiveText}>LIVE</Text>
                          </View>
                        ) : (
                          <View style={styles.headerEndedBadge}>
                            <Text style={styles.headerEndedText}>ENDED</Text>
                          </View>
                        )}
                      </View>
                    ) : null}
                  </View>
                  <Text
                    style={[styles.time, { color: colors.subtitle }]}
                    maxFontSizeMultiplier={1.3}
                  >
                    {getRelativeTime(postItem.createdAt)}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>

        {postItem.hasCover ? (
          <Text
            style={[styles.title, { color: colors.text }]}
            maxFontSizeMultiplier={1.3}
          >
            {title}
          </Text>
        ) : (
          <GradientTitle text={title} style={styles.title} />
        )}
        <Text
          style={[styles.caption, { color: colors.text }]}
          maxFontSizeMultiplier={1.3}
        >
          {description}
        </Text>

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Remove bookmark" : "Save post"}
            style={[styles.actionItem, { backgroundColor: colors.background }]}
            onPress={handleToggleSave}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={15}
              color={isSaved ? colors.primary : colors.subtitle}
            />
            <Text
              style={[
                styles.actionLabel,
                { color: colors.subtitle },
                isSaved && { color: colors.primary, fontWeight: "700" },
              ]}
              maxFontSizeMultiplier={1.3}
            >
              {isSaved ? "Saved" : "Save"}
            </Text>
          </Pressable>
          <Action icon="share-2" label="Share" />
        </View>
      </Pressable>
      <ActionDialog
        visible={showGuestSaveDialog}
        title="Save resources to your library"
        message="Save this resource to your personal library and access it anytime. Log in or create a free account to continue."
        primaryText="Log in"
        secondaryText="Sign up"
        onPrimary={() => router.push("/login" as never)}
        onSecondary={() => router.push("/signup" as never)}
        onClose={() => setShowGuestSaveDialog(false)}
      />
    </Animated.View>
  );
});

const SkeletonTeacherPostCard = () => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.white, marginBottom: spacing.xl },
      ]}
    >
      <Skeleton style={styles.skeletonPreview} />

      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Skeleton style={styles.skeletonAvatar} />
          <View style={{ flex: 1 }}>
            <Skeleton style={styles.skeletonName} />
            <Skeleton style={styles.skeletonTime} />
          </View>
        </View>
        <Skeleton style={styles.skeletonBadge} />
      </View>

      <Skeleton style={styles.skeletonCaption} />
      <Skeleton style={styles.skeletonCaptionShort} />

      <View style={styles.actions}>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} style={styles.skeletonAction} />
        ))}
      </View>
    </View>
  );
};

const Action = ({ icon, label }: { icon: any; label: string }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.actionItem, { backgroundColor: colors.background }]}>
      <Icon name={icon} size={15} color={colors.subtitle} />
      <Text style={[styles.actionLabel, { color: colors.subtitle }]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    width: "100%",
  },
  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: "transparent",
    marginBottom: spacing.xl,
    position: "relative",
    borderRadius: 15,
  },
  menu: { position: "absolute", top: 4, right: 4, zIndex: 4 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  profileRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  name: { fontSize: 14, fontWeight: "500" },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerLiveWrap: {
    marginLeft: 6,
  },
  headerLiveBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    gap: 4,
  },
  headerLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  headerLiveText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  headerEndedBadge: {
    backgroundColor: "rgba(100, 116, 139, 0.2)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  headerEndedText: {
    color: "#64748B",
    fontSize: 10,
    fontWeight: "700",
  },
  liveCardContainer: {
    marginBottom: spacing.md,
    borderRadius: 18,
    overflow: "hidden",
  },
  liveCardBannerWrap: {
    position: "relative",
    borderRadius: 18,
    overflow: "hidden",
    padding: spacing.md,
    minHeight: 180,
    justifyContent: "space-between",
  },
  liveCardBannerImage: {
    ...StyleSheet.absoluteFill,
  },
  liveBannerBadgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  liveStatusPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(234, 67, 53, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 6,
  },
  endedStatusPill: {
    backgroundColor: "rgba(100, 116, 139, 0.85)",
  },
  liveStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  liveStatusPillText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  liveSubjectPill: {
    backgroundColor: "rgba(255, 255, 255, 0.22)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  liveSubjectText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
  },
  liveCoordsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  meetIconShell: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(234, 67, 53, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  liveCoordsInfo: {
    flex: 1,
  },
  liveCoordsLabel: {
    color: "#94A3B8",
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  liveCoordsValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  copyCodeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  copyCodeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  joinLiveButton: {
    borderRadius: radius.md,
    overflow: "hidden",
  },
  joinLiveGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  joinLiveButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "800",
  },
  endedBannerNotice: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  endedBannerNoticeText: {
    color: "#94A3B8",
    fontSize: 13,
    fontWeight: "600",
  },
  hostControlsBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.md,
    marginTop: 6,
  },
  hostNotice: {
    fontSize: 12,
    fontWeight: "500",
  },
  endSessionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  endSessionButtonText: {
    color: "#EF4444",
    fontSize: 11,
    fontWeight: "700",
  },
  time: { fontSize: 12, marginTop: 2 },

  caption: {
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 4,
  },
  gradientTitleMask: {
    alignSelf: "stretch",
  },
  gradientTitleGradient: {
    alignSelf: "stretch",
  },
  gradientTitleText: {
    opacity: 0,
  },
  webGradientTitle: {
    color: "transparent",
    backgroundImage:
      "linear-gradient(135deg, #7b2ff7 0%, #c224f0 50%, #ff002b 100%)",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  } as any,
  previewWrap: {
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.xs,
  },
  preview: { width: "100%", aspectRatio: 1.5 },
  previewOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  previewFallback: {},
  imagePreviewBackdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.82)",
    padding: spacing.md,
  },
  fullImagePreviewFrame: { width: "100%", height: "82%" },
  fullImagePreview: { width: "100%", height: "100%" },
  closePreviewButton: {
    position: "absolute",
    top: spacing.xl,
    right: spacing.lg,
    zIndex: 1,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: 8,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
  },
  actionLabel: { fontSize: 12, fontWeight: "500" },
  skeletonPreview: {
    aspectRatio: 1.5,
    marginBottom: spacing.xs,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  skeletonAvatar: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    marginRight: spacing.sm,
  },
  skeletonName: { height: 14, width: "45%", marginBottom: 6 },
  skeletonTime: { height: 11, width: "28%" },
  skeletonBadge: { height: 28, width: 64, borderRadius: radius.pill },
  skeletonCaption: { height: 13, width: "90%", marginBottom: 6 },
  skeletonCaptionShort: { height: 13, width: "60%", marginBottom: spacing.sm },
  skeletonAction: { height: 34, width: 70, borderRadius: 999 },
});

const layoutStyles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.xs,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  plusBadgeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(15, 23, 42, 0.78)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
    elevation: 4,
    boxShadow: "0px 2px 6px rgba(0,0,0,0.25)",
  },
  plusBadgeText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  singleWrapper: {
    width: "100%",
    aspectRatio: 1.6,
  },
  fullImage: {
    width: "100%",
    height: "100%",
  },
  row2: {
    width: "100%",
    height: 220,
    flexDirection: "row",
    gap: 3,
  },
  halfCell: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
  },
  row3: {
    width: "100%",
    height: 240,
    flexDirection: "row",
    gap: 3,
  },
  threeLeftCell: {
    flex: 1.25,
    height: "100%",
    overflow: "hidden",
  },
  threeRightCol: {
    flex: 1,
    height: "100%",
    flexDirection: "column",
    gap: 3,
  },
  threeSubCell: {
    flex: 1,
    overflow: "hidden",
  },
  grid2x2: {
    width: "100%",
    height: 260,
    flexDirection: "column",
    gap: 3,
  },
  gridRow: {
    flex: 1,
    flexDirection: "row",
    gap: 3,
  },
  quarterCell: {
    flex: 1,
    height: "100%",
    overflow: "hidden",
    position: "relative",
  },
  moreOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.58)",
    alignItems: "center",
    justifyContent: "center",
  },
  moreOverlayPlus: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  moreOverlayLabel: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  modalSeeAllButton: {
    position: "absolute",
    top: spacing.xl,
    left: spacing.lg,
    zIndex: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  modalSeeAllText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  modalNavRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
    marginTop: 12,
  },
  modalNavButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCounterText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
