import { radius } from "@/constants/theme";
import {
  formatVideoUploadedAt,
  resolveVideoImageSource,
  validateVideoLink,
} from "@/utils/videoUtils";
import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { auth } from "../../../firebaseConfig";
import { useProfile } from "../../contexts/ProfileContext";
import { recordUserActivity } from "../../services/activityService";
import {
  getReportErrorMessage,
  submitReport,
} from "../../services/reportService";
import { toggleSavedItem } from "../../services/userProfile";
import { feedbackMessages, showNativeToast } from "../../utils/nativeToast";
import { ActionDialog } from "./ActionDialog";
import { CardActionMenu } from "./CardActionMenu";
import { DurationBadge } from "./DurationBadge";
import { PlayButton } from "./PlayButton";
import { ReportDialog } from "./ReportDialog";
import { TeacherInfo } from "./TeacherInfo";
import { VideoLesson } from "./TrendingVideoCard";

export function VideoCard({
  item: rawItem,
  index,
  isGrid = false,
}: {
  item: VideoLesson;
  index: number;
  isGrid?: boolean;
}) {
  const router = useRouter();
  const { user, profile } = useProfile();
  const [menuAnchor, setMenuAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{
    title: string;
    message: string;
    primaryText?: string;
    secondaryText?: string;
    onPrimary?: () => void;
    onSecondary?: () => void;
  } | null>(null);
  const [showGuestSaveDialog, setShowGuestSaveDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [checkingVideo, setCheckingVideo] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const menuButtonRef = useRef<View>(null);

  const item = {
    ...rawItem,
    uploadedAt: formatVideoUploadedAt(rawItem.uploadedAt),
  };
  const [isSavedState, setIsSavedState] = useState(
    Boolean(user && profile?.["saved-lessons"]?.includes(item.id)),
  );

  useEffect(() => {
    let active = true;
    const nextSavedState = Boolean(
      user && profile?.["saved-lessons"]?.includes(item.id),
    );

    Promise.resolve().then(() => {
      if (active) setIsSavedState(nextSavedState);
    });

    return () => {
      active = false;
    };
  }, [item.id, profile, user]);

  const isSaved = isSavedState;

  async function openLesson() {
    if (checkingVideo) {
      return;
    }

    setCheckingVideo(true);
    const linkCheck = await validateVideoLink(item.link);
    setCheckingVideo(false);

    if (!linkCheck.valid) {
      setDialogState({
        title: "Video unavailable",
        message: linkCheck.message,
        primaryText: "OK",
        onPrimary: () => setDialogState(null),
      });
      return;
    }

    if (auth.currentUser?.uid) {
      recordUserActivity(auth.currentUser.uid, "lesson", item.id);
    }
    router.push({
      pathname: "/lesson-player",
      params: {
        id: item.id,
        title: item.title,
        teacher: item.teacher,
        subject: item.subject,
        description: item.description ?? "",
        duration: item.duration,
        uploadedAt: item.uploadedAt,
        link: item.link ?? "",
        thumbnail: typeof item.thumbnail === "string" ? item.thumbnail : "",
        avatar: typeof item.avatar === "string" ? item.avatar : "",
      },
    });
  }

  const openTeacherProfile = () => {
    router.push({
      pathname: "/teacher-profile",
      params: { name: item.teacher },
    } as any);
  };

  const handleOpenMenu = () => {
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x, y, width, height });
      setActiveMenuId(item.id);
    });
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setActiveMenuId(null);
  };

  const handleToggleSave = async () => {
    if (!user) {
      setShowGuestSaveDialog(true);
      return;
    }

    const nextSaved = !isSaved;
    setIsSavedState(nextSaved);

    try {
      await toggleSavedItem(user.uid, "saved-lessons", item.id, isSaved);
      const showedToast = showNativeToast(
        isSaved ? feedbackMessages.itemUnsaved : feedbackMessages.itemSaved,
      );
      if (!showedToast) {
        setDialogState({
          title: nextSaved ? "Saved to library" : "Removed from saved lessons",
          message: nextSaved
            ? "You can revisit this lesson from your saved collection."
            : "This lesson has been removed from your saved list.",
          primaryText: "Done",
          onPrimary: () => setDialogState(null),
        });
      }
    } catch (error) {
      setIsSavedState(isSaved);
      console.error("Failed to update saved lesson state:", error);
      setDialogState({
        title: "Couldn't update this lesson",
        message: "Please try again.",
        primaryText: "OK",
        onPrimary: () => setDialogState(null),
      });
    }
  };

  const handleShare = async () => {
    const shareUrl = item.link?.trim() || "";

    try {
      await Share.share({
        title: item.title,
        message: `Watch "${item.title}" by ${item.teacher} on DigiLearn.`,
        url: shareUrl,
      });
    } catch (error) {
      console.error("Failed to share lesson:", error);
      setDialogState({
        title: "Couldn't share this lesson",
        message: "Please try again.",
        primaryText: "OK",
        onPrimary: () => setDialogState(null),
      });
    }
  };

  const handleReportProblem = () => {
    setReportError(null);
    setShowReportDialog(true);
  };

  const handleSubmitReport = async (reasons: string[], details: string) => {
    if (!user) {
      setReportError("Please log in to send a report.");
      return;
    }
    setReportSubmitting(true);
    setReportError(null);
    try {
      await submitReport({
        reasons,
        details,
        item: { type: "lesson", id: item.id, name: item.title },
      });
      setShowReportDialog(false);
      setDialogState({
        title: "Report sent",
        message: "Thanks. We'll review this lesson and investigate the issue.",
        primaryText: "Done",
        onPrimary: () => setDialogState(null),
      });
    } catch (error) {
      console.error("Failed to submit report:", error);
      setReportError(getReportErrorMessage(error));
    } finally {
      setReportSubmitting(false);
    }
  };

  const menuActions = [
    {
      label: isSaved ? "Remove bookmark" : "Save lesson",
      icon: "bookmark",
      accessibilityLabel: isSaved
        ? "Remove this lesson from saved"
        : "Save this lesson",
      onPress: handleToggleSave,
    },
    {
      label: "Share",
      icon: "share-2",
      accessibilityLabel: "Share this lesson",
      onPress: handleShare,
    },
    {
      label: "Report a problem",
      icon: "alert-circle",
      accessibilityLabel: "Report a problem with this lesson",
      onPress: handleReportProblem,
    },
  ] as const;

  return (
    <>
      <Animated.View
        entering={FadeInDown.delay(Math.min(index * 60, 300)).duration(380)}
        style={[styles.card, isGrid && styles.gridCard]}
      >
        <View style={styles.thumbnail}>
          <Pressable style={StyleSheet.absoluteFill} onPress={openLesson}>
            <Image
              source={resolveVideoImageSource(item.thumbnail, item.link)}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={250}
            />
            <View style={styles.overlay} />
            <View style={styles.play}>
              <PlayButton label={`Play ${item.title}`} />
            </View>
            <View style={styles.duration}>
              <DurationBadge duration={item.duration} />
            </View>
            {item.isNew && (
              <View style={styles.new}>
                <Text style={styles.newText}>NEW</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            ref={menuButtonRef}
            accessibilityRole="button"
            accessibilityLabel="More options"
            style={styles.menuButton}
            onPress={handleOpenMenu}
          >
            <Icon name="more-vertical" size={18} color="#fff" />
          </Pressable>
        </View>
        <TeacherInfo
          name={item.teacher}
          uploadedAt={item.uploadedAt}
          onPress={openTeacherProfile}
        />
        <Text numberOfLines={2} style={styles.title}>
          {item.title}
        </Text>
      </Animated.View>

      <CardActionMenu
        visible={activeMenuId === item.id && !!menuAnchor}
        anchor={menuAnchor}
        actions={menuActions.map((action) => ({
          ...action,
          icon: action.icon as any,
        }))}
        onClose={handleCloseMenu}
      />

      <ActionDialog
        visible={Boolean(dialogState)}
        title={dialogState?.title ?? "Notice"}
        message={dialogState?.message ?? ""}
        primaryText={dialogState?.primaryText ?? "OK"}
        secondaryText={dialogState?.secondaryText}
        onPrimary={() => {
          const onPrimary = dialogState?.onPrimary;
          setDialogState(null);
          onPrimary?.();
        }}
        onSecondary={() => {
          const onSecondary = dialogState?.onSecondary;
          setDialogState(null);
          onSecondary?.();
        }}
        onClose={() => setDialogState(null)}
      />

      <ActionDialog
        visible={showGuestSaveDialog}
        title="Save lessons to your library"
        message="Save this lesson to your personal library and access it anytime. Log in or create a free account to continue."
        primaryText="Log in"
        secondaryText="Sign up"
        onPrimary={() => router.push("/login" as never)}
        onSecondary={() => router.push("/signup" as never)}
        onClose={() => setShowGuestSaveDialog(false)}
      />

      <ReportDialog
        visible={showReportDialog}
        itemName={item.title}
        submitting={reportSubmitting}
        error={reportError}
        onSubmit={handleSubmitReport}
        onClose={() => setShowReportDialog(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 48 },
  gridCard: { marginHorizontal: 8 },
  thumbnail: {
    backgroundColor: "#ddd",
    borderRadius: radius.sm,
    height: 200,
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.25)" },
  play: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  duration: { bottom: 10, position: "absolute", right: 10 },
  menuButton: {
    position: "absolute",
    right: 8,
    top: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 5,
  },
  new: {
    backgroundColor: "#FF3B30",
    borderRadius: 6,
    left: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: "absolute",
    top: 10,
  },
  newText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: "#111",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 5,
    textTransform: "capitalize",
  },
});
