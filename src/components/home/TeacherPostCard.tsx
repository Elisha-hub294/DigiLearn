import { FirebaseImage as Image } from "@/components/ui/FirebaseImage";
import { Feather as Icon, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  Animated as RNAnimated,
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
import { toggleSavedItem } from "../../services/userProfile";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../../utils/interestFilter";
import { feedbackMessages, showNativeToast } from "../../utils/nativeToast";
import { ActionDialog } from "../ui/ActionDialog";
import { ResourceDeleteMenu } from "../ui/ResourceDeleteMenu";

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
  createdAt?: Date | null;
  document?: string;
  fileType?: "image" | "doc" | "";
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
    document,
    fileType,
    createdAt,
  } satisfies TeacherPost;
};

const teacherPostCollections = [
  "teacherPosts",
  "teacherPostsCards",
  "teacherUpdates",
];

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

    // Fetch default user icon
    const fetchDefaultIcons = async () => {
      try {
        const defaultRef = collection(db, "default");
        const defaultSnap = await getDocs(defaultRef);

        defaultSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.name === "user" && typeof data.icon === "string") {
            if (isMounted) setDefaultUserAvatar(data.icon);
          }
        });
      } catch (err) {
        console.warn("Could not fetch default icons", err);
      }
    };

    // Fetch teachers list for avatars mapping
    const fetchTeachersAvatars = async () => {
      try {
        const teachersRef = collection(db, "teachers");
        const teachersSnap = await getDocs(teachersRef);
        const avatarMap: Record<string, string> = {};
        const profiles: Record<string, { name: string; avatar?: string }> = {};

        teachersSnap.docs.forEach((doc) => {
          const data = doc.data();
          const name = typeof data.name === "string" ? data.name : "Teacher";
          const avatar =
            typeof data.avatar === "string" ? data.avatar : undefined;
          avatarMap[name] = avatar || "";
          profiles[doc.id] = { name, avatar };
          if (
            typeof data.name === "string" &&
            typeof data.avatar === "string"
          ) {
            avatarMap[data.name] = data.avatar;
          }
        });

        if (isMounted) {
          setTeacherAvatars(avatarMap);
          setOwnerProfiles(profiles);
        }
      } catch (err) {
        console.warn("Could not fetch teachers list", err);
      }
    };

    // Fetch posts
    const fetchTeacherPost = async () => {
      if (providedPosts) {
        setPosts(providedPosts);
        setLoading(false);
        return;
      }
      try {
        for (const collectionName of teacherPostCollections) {
          try {
            const postsRef = collection(db, collectionName);
            const postsQuery = query(postsRef, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(postsQuery);

            if (!isMounted) return;

            const fetchedPosts = snapshot.docs.map((doc) =>
              normalizeTeacherPost(doc),
            );

            if (fetchedPosts.length > 0) {
              setPosts(fetchedPosts);
              setLoading(false);
              return;
            }
          } catch (queryError) {
            console.warn(
              `Teacher post collection ${collectionName} unavailable`,
              queryError,
            );
          }
        }

        if (isMounted) {
          setPosts([]);
        }
      } catch (error) {
        console.error("Failed to load teacher post", error);
        if (isMounted) {
          setPosts([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDefaultIcons();
    fetchTeachersAvatars();
    fetchTeacherPost();

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
      renderItem={({ item: postItem, index }) => (
        <TeacherPostItem
          key={postItem.id}
          postItem={postItem}
          index={index}
          isWide={isWide}
          teacherAvatars={teacherAvatars}
          ownerProfiles={ownerProfiles}
          defaultUserAvatar={defaultUserAvatar}
          isVisible={visiblePostIds.has(postItem.id)}
        />
      )}
    />
  );
};

const TeacherPostItem = ({
  postItem,
  index,
  isWide,
  teacherAvatars,
  ownerProfiles,
  defaultUserAvatar,
  isVisible,
}: {
  postItem: TeacherPost;
  index: number;
  isWide: boolean;
  teacherAvatars: Record<string, string>;
  ownerProfiles: Record<string, { name: string; avatar?: string }>;
  defaultUserAvatar: string | null;
  isVisible: boolean;
}) => {
  const { user, profile } = useProfile();
  const { colors } = useTheme();
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  const [showGuestSaveDialog, setShowGuestSaveDialog] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const ownerProfile = postItem.owner
    ? ownerProfiles[postItem.owner]
    : undefined;
  const rawTeacherName = ownerProfile?.name || postItem.teacher || "Teacher";
  const teacherName = `Tr. ${rawTeacherName}`;
  const description =
    postItem.description ?? "No teacher update available yet.";
  const title = postItem.title || "Teacher update";
  const hideOwner = postItem.ownerType?.trim().toLowerCase() === "admin";

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

    if (postItem.fileType === "image") setShowImagePreview(true);
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
            light
          />
        </View>
        {postItem.hasCover && postItem.cover ? (
          <Pressable
            {...({
              onHoverIn: () => setIsHovered(true),
              onHoverOut: () => setIsHovered(false),
            } as any)}
            style={styles.previewWrap}
            onPress={handlePreviewPress}
            accessibilityRole="button"
            accessibilityLabel={
              postItem.fileType === "doc" ? "Open PDF" : "Open image preview"
            }
          >
            <Image
              source={{ uri: postItem.cover }}
              style={styles.preview}
              contentFit="cover"
            />
            <View pointerEvents="none" style={styles.previewOverlay} />
          </Pressable>
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
            <Pressable
              style={styles.fullImagePreviewFrame}
              onPress={(event) => event.stopPropagation()}
            >
              <Image
                source={{ uri: postItem.cover }}
                style={styles.fullImagePreview}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </Modal>

        <View style={styles.header}>
          {!hideOwner && (
            <View style={styles.profileRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open teacher profile: ${rawTeacherName}`}
                onPress={() =>
                  router.push({
                    pathname: "/teacher-profile",
                    params: { name: rawTeacherName },
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
                accessibilityRole="button"
                accessibilityLabel={`Open teacher profile: ${rawTeacherName}`}
                onPress={() =>
                  router.push({
                    pathname: "/teacher-profile",
                    params: { name: rawTeacherName },
                  } as never)
                }
              >
                <View>
                  <Text style={[styles.name, { color: colors.text }]}>
                    {teacherName}
                  </Text>
                  <Text style={[styles.time, { color: colors.subtitle }]}>
                    {getRelativeTime(postItem.createdAt)}
                  </Text>
                </View>
              </Pressable>
            </View>
          )}
        </View>

        {postItem.hasCover ? (
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        ) : (
          <GradientTitle text={title} style={styles.title} />
        )}
        <Text style={[styles.caption, { color: colors.text }]}>
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
};

const SkeletonTeacherPostCard = () => {
  const { colors } = useTheme();
  const [pulseAnim] = useState(() => new RNAnimated.Value(0.3));

  useEffect(() => {
    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.white, marginBottom: spacing.xl },
      ]}
    >
      <RNAnimated.View
        style={[
          styles.skeletonBox,
          { backgroundColor: colors.border },
          styles.skeletonPreview,
          { opacity: pulseAnim },
        ]}
      />

      <View style={styles.header}>
        <View style={styles.profileRow}>
          <RNAnimated.View
            style={[
              styles.skeletonBox,
              { backgroundColor: colors.border },
              styles.skeletonAvatar,
              { opacity: pulseAnim },
            ]}
          />
          <View style={{ flex: 1 }}>
            <RNAnimated.View
              style={[
                styles.skeletonBox,
                { backgroundColor: colors.border },
                styles.skeletonName,
                { opacity: pulseAnim },
              ]}
            />
            <RNAnimated.View
              style={[
                styles.skeletonBox,
                { backgroundColor: colors.border },
                styles.skeletonTime,
                { opacity: pulseAnim },
              ]}
            />
          </View>
        </View>
        <RNAnimated.View
          style={[
            styles.skeletonBox,
            { backgroundColor: colors.border },
            styles.skeletonBadge,
            { opacity: pulseAnim },
          ]}
        />
      </View>

      <RNAnimated.View
        style={[
          styles.skeletonBox,
          { backgroundColor: colors.border },
          styles.skeletonCaption,
          { opacity: pulseAnim },
        ]}
      />
      <RNAnimated.View
        style={[
          styles.skeletonBox,
          { backgroundColor: colors.border },
          styles.skeletonCaptionShort,
          { opacity: pulseAnim },
        ]}
      />

      <View style={styles.actions}>
        {[0, 1, 2].map((i) => (
          <RNAnimated.View
            key={i}
            style={[
              styles.skeletonBox,
              { backgroundColor: colors.border },
              styles.skeletonAction,
              { opacity: pulseAnim },
            ]}
          />
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
  preview: { width: "100%", height: 250 },
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
  skeletonBox: { borderRadius: radius.sm },
  skeletonPreview: {
    height: 250,
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
