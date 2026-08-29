import { Feather as Icon, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { type TeacherPost } from "../constants/homeData";
import { colors, radius, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import { toggleSavedItem } from "../services/userProfile";
import { ActionDialog } from "./ui/ActionDialog";

export const TeacherPostCard = ({
  post,
  hidePreview = false,
  hideActions = false,
}: {
  post: TeacherPost;
  hidePreview?: boolean;
  hideActions?: boolean;
}) => {
  const router = useRouter();
  const { user, profile } = useProfile();
  const [showGuestSaveDialog, setShowGuestSaveDialog] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const contentStyle = [
    styles.content,
    post.type === "announcement" && styles.announcementContent,
  ];
  const hideOwner = post.ownerType?.trim().toUpperCase() === "ID";

  const isSaved = Boolean(user && profile?.["saved-posts"]?.includes(post.id));

  const handleToggleSave = async () => {
    if (!user) {
      setShowGuestSaveDialog(true);
      return;
    }
    try {
      await toggleSavedItem(user.uid, "saved-posts", post.id, isSaved);
    } catch (err) {
      console.error("Failed to toggle saved post:", err);
    }
  };

  const handlePreviewPress = () => {
    if (post.type === "image") {
      setShowImagePreview(true);
      return;
    }

    if (post.type === "pdf" && post.document) {
      router.push({
        pathname: "/pdf-reader",
        params: {
          uri: encodeURIComponent(post.document),
          title: post.teacherName,
        },
      } as never);
    }
  };

  return (
    <>
      <Animated.View entering={FadeInUp.duration(500)} style={styles.card}>
        <View style={styles.header}>
          {!hideOwner && (
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
                    <Icon
                      name="check-circle"
                      size={14}
                      color={colors.primary}
                    />
                  ) : null}
                </View>
                <Text style={styles.time}>{post.time}</Text>
              </View>
            </View>
          )}
        </View>
        <Text style={contentStyle}>{post.content}</Text>
        {!hidePreview && (
          <Pressable
            style={styles.previewWrap}
            onPress={handlePreviewPress}
            disabled={post.type === "announcement"}
            accessibilityRole={
              post.type === "announcement" ? undefined : "button"
            }
            accessibilityLabel={
              post.type === "image"
                ? "Open image preview"
                : post.type === "pdf"
                  ? "Open PDF"
                  : undefined
            }
          >
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
          </Pressable>
        )}
        {!hideActions && (
          <View style={styles.footer}>
            <Pressable
              style={styles.action}
              accessibilityLabel={isSaved ? "Remove bookmark" : "Save post"}
              onPress={handleToggleSave}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={16}
                color={isSaved ? colors.primary : colors.subtitle}
              />
            </Pressable>
          </View>
        )}
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
              <Icon name="x" size={24} color={colors.white} />
            </Pressable>
            <Pressable
              style={styles.fullImagePreviewFrame}
              onPress={(event) => event.stopPropagation()}
            >
              <Image
                source={post.previewImage}
                style={styles.fullImagePreview}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </Modal>
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
    </>
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
