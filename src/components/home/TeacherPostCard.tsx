import { Feather as Icon } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import * as IntentLauncher from "expo-intent-launcher";
import { useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  Animated as RNAnimated,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { db } from "../../../firebaseConfig";
import { colors, radius, spacing } from "../../constants/theme";
import PdfPreview from "./PdfPreview";

type TeacherPost = {
  id: string;
  teacher?: string;
  subject?: string;
  description?: string;
  hasPdf?: boolean;
  createdAt?: unknown;
  document?: string;
};

const normalizeTeacherPost = (doc: {
  id: string;
  data: () => Record<string, unknown>;
}) => {
  const data = doc.data();

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
      : typeof data.content === "string"
        ? data.content
        : typeof data.message === "string"
          ? data.message
          : undefined;

  const hasPdf =
    typeof data.hasPdf === "boolean"
      ? data.hasPdf
      : typeof data.type === "string"
        ? data.type === "pdf"
        : true;

  const document =
    typeof data.document === "string" ? data.document : undefined;

  return {
    id: doc.id,
    teacher,
    subject,
    description,
    hasPdf,
    document,
  } satisfies TeacherPost;
};

const openPdfDocument = async (url: string) => {
  if (!url) return;

  if (Platform.OS === "android") {
    try {
      const filename = url.split("/").pop()?.split("?")[0] || "document.pdf";
      const cacheDir = (FileSystem as any).cacheDirectory || "";
      const fileUri = `${cacheDir}${Date.now()}_${filename}`;

      const downloadResult = await FileSystem.downloadAsync(url, fileUri);
      const contentUri = await FileSystem.getContentUriAsync(
        downloadResult.uri,
      );

      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        type: "application/pdf",
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      });
    } catch (error) {
      console.error("Error launching PDF intent:", error);
      Linking.openURL(url).catch(console.error);
    }
  } else {
    Linking.openURL(url).catch(console.error);
  }
};

const teacherPostCollections = [
  "teacherPosts",
  "teacherPostsCards",
  "teacherUpdates",
];

export const TeacherPostCard = () => {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [posts, setPosts] = useState<TeacherPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Database assets states
  const [teacherAvatars, setTeacherAvatars] = useState<Record<string, string>>(
    {},
  );
  const [defaultUserAvatar, setDefaultUserAvatar] = useState<string | null>(
    null,
  );
  const [defaultPdfImage, setDefaultPdfImage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Fetch default icons (user & pdf)
    const fetchDefaultIcons = async () => {
      try {
        const defaultRef = collection(db, "default");
        const defaultSnap = await getDocs(defaultRef);

        defaultSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (data.name === "user" && typeof data.icon === "string") {
            if (isMounted) setDefaultUserAvatar(data.icon);
          }
          if (data.name === "pdf" && typeof data.icon === "string") {
            if (isMounted) setDefaultPdfImage(data.icon);
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

        teachersSnap.docs.forEach((doc) => {
          const data = doc.data();
          if (
            typeof data.name === "string" &&
            typeof data.avatar === "string"
          ) {
            avatarMap[data.name] = data.avatar;
          }
        });

        if (isMounted) {
          setTeacherAvatars(avatarMap);
        }
      } catch (err) {
        console.warn("Could not fetch teachers list", err);
      }
    };

    // Fetch posts
    const fetchTeacherPost = async () => {
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
  }, []);

  if (loading) {
    return (
      <View style={styles.list}>
        {[0, 1].map((i) => (
          <SkeletonTeacherPostCard key={i} />
        ))}
      </View>
    );
  }

  if (posts.length === 0) {
    return (
      <Animated.View entering={FadeInUp.duration(500)} style={[styles.card]}>
        <Text style={styles.caption}>No teacher updates available yet.</Text>
      </Animated.View>
    );
  }

  return (
    <View style={styles.list}>
      {posts.map((postItem, index) => (
        <TeacherPostItem
          key={postItem.id}
          postItem={postItem}
          index={index}
          isWide={isWide}
          teacherAvatars={teacherAvatars}
          defaultUserAvatar={defaultUserAvatar}
          defaultPdfImage={defaultPdfImage}
        />
      ))}
    </View>
  );
};

const TeacherPostItem = ({
  postItem,
  index,
  isWide,
  teacherAvatars,
  defaultUserAvatar,
  defaultPdfImage,
}: {
  postItem: TeacherPost;
  index: number;
  isWide: boolean;
  teacherAvatars: Record<string, string>;
  defaultUserAvatar: string | null;
  defaultPdfImage: string | null;
}) => {
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);

  const rawTeacherName = postItem.teacher || "Teacher";
  const teacherName = `Tr. ${rawTeacherName}`;
  const subject = postItem.subject ?? "Physics";
  const description =
    postItem.description ?? "No teacher update available yet.";
  const showPreview = postItem.hasPdf ?? true;

  // Resolve Teacher Avatar from DB or Fallback
  const resolvedAvatar =
    (postItem.teacher && teacherAvatars[postItem.teacher]) ||
    defaultUserAvatar ||
    "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/tr-default.png";

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
          (pressed || hovered || isHovered) && {
            backgroundColor: "#f0f0f0",
          },
        ]}
      >
        {showPreview ? (
          <Pressable
            {...({
              onHoverIn: () => setIsHovered(true),
              onHoverOut: () => setIsHovered(false),
            } as any)}
            style={styles.previewWrap}
            onPress={() => {
              if (postItem.document) {
                openPdfDocument(postItem.document);
              }
            }}
          >
            {postItem.document ? (
              <PdfPreview uri={postItem.document} style={styles.preview} />
            ) : (
              <Image
                source={
                  defaultPdfImage
                    ? { uri: defaultPdfImage }
                    : require("../../../assets/images/pdf-preview.jpeg")
                }
                style={styles.preview}
                contentFit="cover"
              />
            )}
            <View style={styles.overlay} />
            <View style={styles.previewTag}>
              <Text style={styles.previewTagText}>PDF</Text>
            </View>
          </Pressable>
        ) : null}

        <View style={styles.header}>
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
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{teacherName}</Text>
                  <Icon name="check-circle" size={14} color={colors.primary} />
                </View>
                <Text style={styles.time}>Recently shared</Text>
              </View>
            </Pressable>
          </View>
        </View>

        <Text style={styles.caption}>{description}</Text>

        <View style={styles.actions}>
          <Action icon="bookmark" label="Save" />
          <Action icon="share-2" label="Share" />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const SkeletonTeacherPostCard = () => {
  const pulseAnim = useRef(new RNAnimated.Value(0.3)).current;

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
    <View style={[styles.card, { marginBottom: spacing.xl }]}>
      <RNAnimated.View
        style={[
          styles.skeletonBox,
          styles.skeletonPreview,
          { opacity: pulseAnim },
        ]}
      />

      <View style={styles.header}>
        <View style={styles.profileRow}>
          <RNAnimated.View
            style={[
              styles.skeletonBox,
              styles.skeletonAvatar,
              { opacity: pulseAnim },
            ]}
          />
          <View style={{ flex: 1 }}>
            <RNAnimated.View
              style={[
                styles.skeletonBox,
                styles.skeletonName,
                { opacity: pulseAnim },
              ]}
            />
            <RNAnimated.View
              style={[
                styles.skeletonBox,
                styles.skeletonTime,
                { opacity: pulseAnim },
              ]}
            />
          </View>
        </View>
        <RNAnimated.View
          style={[
            styles.skeletonBox,
            styles.skeletonBadge,
            { opacity: pulseAnim },
          ]}
        />
      </View>

      <RNAnimated.View
        style={[
          styles.skeletonBox,
          styles.skeletonCaption,
          { opacity: pulseAnim },
        ]}
      />
      <RNAnimated.View
        style={[
          styles.skeletonBox,
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
              styles.skeletonAction,
              { opacity: pulseAnim },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const Action = ({ icon, label }: { icon: any; label: string }) => (
  <View style={styles.actionItem}>
    <Icon name={icon} size={15} color={colors.subtitle} />
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  list: {
    width: "100%",
  },
  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.white,
    marginBottom: spacing.xl,
  },
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
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { color: colors.text, fontSize: 14, fontWeight: "500" },
  time: { color: colors.subtitle, fontSize: 12, marginTop: 2 },

  caption: {
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  previewWrap: {
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.xs,
  },
  preview: { width: "100%", height: 250 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  previewTag: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  previewTagText: { color: colors.white, fontSize: 11, fontWeight: "800" },
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
    backgroundColor: colors.background,
  },
  actionLabel: { color: colors.subtitle, fontSize: 12, fontWeight: "500" },
  skeletonBox: { backgroundColor: "#EFEFEF", borderRadius: radius.sm },
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
