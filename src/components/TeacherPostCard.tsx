import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { subjectColors, type TeacherPost } from "../constants/homeData";
import { colors, radius, spacing } from "../constants/theme";

export const TeacherPostCard = ({
  post,
  hidePreview = false,
  hideActions = false,
}: {
  post: TeacherPost;
  hidePreview?: boolean;
  hideActions?: boolean;
}) => {
  const accent = subjectColors[post.subject] ?? "#3B82F6";
  const contentStyle = [
    styles.content,
    post.type === "announcement" && styles.announcementContent,
  ];

  return (
    <Animated.View entering={FadeInUp.duration(500)} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image
            source={post.teacherImage}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.profileMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>{post.teacherName}</Text>
              {post.verified ? (
                <Icon name="check-circle" size={14} color={colors.primary} />
              ) : null}
            </View>
            <Text style={styles.time}>{post.time}</Text>
          </View>
        </View>
      </View>
      <Text style={contentStyle}>{post.content}</Text>
      {!hidePreview && (
        <View style={styles.previewWrap}>
          <Image
            source={post.previewImage}
            style={styles.preview}
            contentFit="cover"
          />
          <View style={styles.overlay} />
          <View style={styles.previewBadge}>
            <Icon
              name={
                post.type === "pdf"
                  ? "file-text"
                  : post.type === "image"
                    ? "image"
                    : "message-circle"
              }
              size={16}
              color={colors.white}
            />
            <Text style={styles.previewText}>{post.type.toUpperCase()}</Text>
          </View>
        </View>
      )}
      {!hideActions && (
        <View style={styles.footer}>
          <Pressable style={styles.action} accessibilityLabel="Save post">
            <Icon name="bookmark" size={15} color={colors.subtitle} />
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  profileRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, marginRight: spacing.sm },
  profileMeta: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { color: colors.text, fontSize: 14, fontWeight: "700" },
  time: { color: colors.subtitle, fontSize: 12, marginTop: 2 },
  content: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  announcementContent: {
    fontSize: 20,
    lineHeight: 22,
  },
  previewWrap: {
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.md,
  },
  preview: { width: "100%", height: 180 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.25)" },
  previewBadge: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(15,23,42,0.55)",
  },
  previewText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  footer: { flexDirection: "row" },
  action: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
});
