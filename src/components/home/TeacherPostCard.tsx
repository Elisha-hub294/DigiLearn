import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated as RNAnimated,
  Linking,
  Pressable,
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

const getTeacherAvatar = (teacher?: string) => {
  if (teacher === "Opero Stephen") {
    return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/opero-stephen.jpeg";
  }
  return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/tr-default.png";
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

  useEffect(() => {
    let isMounted = true;

    const fetchTeacherPost = async () => {
      try {
        for (const collectionName of teacherPostCollections) {
          try {
            const postsRef = collection(db, collectionName);
            const postsQuery = query(postsRef, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(postsQuery);

            if (!isMounted) {
              return;
            }

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
      <Animated.View
        entering={FadeInUp.duration(500)}
        style={[styles.card, isWide && styles.cardWide]}
      >
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
        />
      ))}
    </View>
  );
};

const TeacherPostItem = ({
  postItem,
  index,
  isWide,
}: {
  postItem: TeacherPost;
  index: number;
  isWide: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const teacherName = postItem.teacher
    ? `Tr. ${postItem.teacher}`
    : "Tr. Teacher";
  const subject = postItem.subject ?? "Physics";
  const description =
    postItem.description ?? "No teacher update available yet.";
  const showPreview = postItem.hasPdf ?? true;

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
          isWide && styles.cardWide,
          (pressed || hovered || isHovered) && {
            backgroundColor: "#f0f0f0",
            borderWidth: 1,
            borderColor: "#d8d8d8",
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
                Linking.openURL(postItem.document).catch((err) =>
                  console.error("Couldn't load page", err),
                );
              }
            }}
          >
            {postItem.document ? (
              <PdfPreview uri={postItem.document} style={styles.preview} />
            ) : (
              <Image
                source={require("../../../assets/images/pdf-preview.jpeg")}
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
            <Image
              source={{ uri: getTeacherAvatar(postItem.teacher) }}
              style={styles.avatar}
              contentFit="cover"
            />
            <View>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{teacherName}</Text>
                <Icon name="check-circle" size={14} color={colors.primary} />
              </View>
              <Text style={styles.time}>Recently shared</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: "#001172" }]}>
            <Text style={styles.badgeText}>{subject}</Text>
          </View>
        </View>

        <Text style={styles.caption}>{description}</Text>

        <View style={styles.actions}>
          <Action icon="star" label="Like" />
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
      {/* PDF preview block */}
      <RNAnimated.View
        style={[
          styles.skeletonBox,
          styles.skeletonPreview,
          { opacity: pulseAnim },
        ]}
      />

      {/* Header: avatar + name/time lines + badge */}
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

      {/* Caption lines */}
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

      {/* Action pills */}
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
    padding: 7,
    borderRadius: radius.lg,
    borderColor: "#fff",
    borderWidth: 1,
  },
  cardWide: {
    width: "100%",
    maxWidth: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
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
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  caption: {
    color: colors.text,
    fontSize: 14,
    marginBottom: spacing.sm,
  },
  previewWrap: {
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.xs,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
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
  // Skeleton styles
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
