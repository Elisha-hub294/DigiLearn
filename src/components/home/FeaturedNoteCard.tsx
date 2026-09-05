import { Feather as Icon, Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { auth, db } from "../../../firebaseConfig";
import { colors, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";
import { recordUserActivity } from "../../services/activityService";
import {
  getReportErrorMessage,
  submitReport,
} from "../../services/reportService";
import { deleteResource } from "../../services/resourceDeletion";
import {
  getHiddenPageEntries,
  getMarkedReadItemIds,
  setPageHiddenState,
  togglePageReadState,
  toggleSavedItem,
} from "../../services/userProfile";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../../utils/interestFilter";
import { feedbackMessages, showNativeToast } from "../../utils/nativeToast";
import { ActionDialog } from "../ui/ActionDialog";
import { CardActionMenu } from "../ui/CardActionMenu";
import { FirebaseImage } from "../ui/FirebaseImage";
import { ReportDialog } from "../ui/ReportDialog";
import { Skeleton } from "../ui/Skeleton";

type TopicalNote = {
  id: string;
  owner?: string;
  title?: string;
  description?: string;
  subject?: string | string[];
  author?: string;
  preview?: string;
  cover?: string;
  image?: string;
  document?: string;
  book?: string | string[];
  updatedAt?: any;
  level?: string;
  readStatus?: string;
  isRead?: boolean;
  progress?: number;
};

type FeaturedNoteCardProps = {
  subject?: string;
  hideAvatar?: boolean;
  notes?: {
    id: string;
    title?: string;
    description?: string;
    subject?: string | string[];
    author?: string;
    preview?: string;
    cover?: string;
    image?: string;
    document?: string;
    book?: string | string[];
    updatedAt?: any;
    createdAt?: any;
    level?: string;
    readStatus?: string;
    isRead?: boolean;
    progress?: number;
  }[];
  loading?: boolean;
  source?: "home" | "library" | "pages";
  includeHiddenItems?: boolean;
  filterByInterests?: boolean;
  onEndReached?: () => void;
  loadingMore?: boolean;
  hasMore?: boolean;
};

const normalizeKey = (str: string) => str.trim().toLowerCase();

export const FeaturedNoteCard = ({
  subject,
  hideAvatar = false,
  notes: providedNotes,
  loading: externalLoading,
  source = "home",
  includeHiddenItems = false,
  filterByInterests,
  onEndReached,
  loadingMore = false,
  hasMore = false,
}: FeaturedNoteCardProps) => {
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const isWide = width >= 900;
  const [notes, setNotes] = useState<TopicalNote[]>([]);
  const [subjectAvatars, setSubjectAvatars] = useState<Record<string, string>>(
    {},
  );
  const [defaultAvatar, setDefaultAvatar] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [visibleNoteIds, setVisibleNoteIds] = useState<Set<string>>(
    () => new Set(),
  );
  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 1 }),
    [],
  );
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setVisibleNoteIds(
        new Set(
          viewableItems
            .map((token) => (token.item as TopicalNote | undefined)?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      );
    },
    [],
  );
  const hiddenIds = useMemo(
    () =>
      new Set(
        (includeHiddenItems ? [] : getHiddenPageEntries(profile)).map(
          (p) => p.id,
        ),
      ),
    [includeHiddenItems, profile],
  );

  useEffect(() => {
    let active = true;

    const loadMetadata = async () => {
      const [notesSnap, subjectsSnap, defaultSnap] = await Promise.all([
        providedNotes
          ? Promise.resolve(null)
          : getDocs(
              query(collection(db, "pages"), orderBy("updatedAt", "desc")),
            ),
        getDocs(collection(db, "subject")),
        getDocs(collection(db, "default")),
      ]);

      if (!active) return;

      let userDefaultIcon = "";
      defaultSnap.docs.forEach((d) => {
        const data = d.data();
        if (
          typeof data.name === "string" &&
          normalizeKey(data.name) === "user" &&
          typeof data.icon === "string"
        ) {
          userDefaultIcon = data.icon.trim();
        }
      });
      setDefaultAvatar(userDefaultIcon);

      const subjectMap: Record<string, string> = {};
      subjectsSnap.docs.forEach((d) => {
        const data = d.data();
        if (typeof data.name === "string" && typeof data.avatar === "string") {
          subjectMap[normalizeKey(data.name)] = data.avatar.trim();
        }
      });
      setSubjectAvatars(subjectMap);

      const allNotes =
        notesSnap?.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            ...data,
            document:
              [data.doc, data.document, data.pdf, data.url].find(
                (v): v is string => typeof v === "string" && v.length > 0,
              ) ?? undefined,
          } as TopicalNote;
        }) ?? [];
      const filteredNotes = subject
        ? allNotes.filter((note) => {
            const noteSubjects = Array.isArray(note.subject)
              ? note.subject
              : [note.subject ?? ""];
            return noteSubjects.some(
              (entry) => normalizeKey(entry) === normalizeKey(subject),
            );
          })
        : allNotes;

      if (!providedNotes) {
        setNotes(filteredNotes);
      }
    };

    if (providedNotes) {
      loadMetadata().catch((e) => {
        console.error("Error loading featured note metadata:", e);
        if (active) setNotes([]);
      });
      return () => {
        active = false;
      };
    }

    loadMetadata()
      .catch((e) => {
        console.error("Error loading featured notes:", e);
        if (active) setNotes([]);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [externalLoading, providedNotes, subject]);

  const listData = useMemo(() => {
    const sourceNotes = providedNotes ?? notes;
    let result = includeHiddenItems
      ? sourceNotes
      : sourceNotes.filter((note) => !hiddenIds.has(note.id));

    if (filterByInterests ?? shouldFilterByInterests(profile)) {
      result = result.filter((note) =>
        matchesUserInterests(note.subject, profile?.subjects),
      );
    }
    return result;
  }, [
    filterByInterests,
    hiddenIds,
    includeHiddenItems,
    notes,
    profile,
    providedNotes,
  ]);

  if ((providedNotes ? Boolean(externalLoading) : loading) || externalLoading) {
    return (
      <View style={[styles.list, isWide && styles.listWide]}>
        <SkeletonNoteCard isWide={isWide} />
      </View>
    );
  }

  if (!listData.length) return null;

  return (
    <View style={[styles.list, isWide && styles.listWide]}>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={source === "pages"}
        scrollEnabled={source === "pages"}
        contentContainerStyle={styles.listContent}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        ListFooterComponent={
          loadingMore ? (
            <Text style={styles.paginationStatus}>
              Loading more resources...
            </Text>
          ) : hasMore ? (
            <Pressable onPress={onEndReached} style={styles.loadMoreButton}>
              <Text style={styles.loadMoreText}>Load more resources</Text>
            </Pressable>
          ) : null
        }
        renderItem={({ item }) => (
          <FeaturedNoteItem
            note={item}
            subjectAvatars={subjectAvatars}
            defaultAvatar={defaultAvatar}
            isWide={isWide}
            source={source}
            subject={subject}
            hideAvatar={hideAvatar}
            includeHiddenItems={includeHiddenItems}
            isVisible={visibleNoteIds.has(item.id)}
          />
        )}
      />
    </View>
  );
};

const SkeletonNoteCard = ({ isWide }: { isWide: boolean }) => {
  const { colors: themeColors } = useTheme();

  return (
    <View style={[styles.itemWrapper, isWide && styles.itemWrapperWide]}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: themeColors.white,
            borderColor: themeColors.border,
          },
        ]}
      >
        <Skeleton style={[styles.previewWrap, styles.skeletonPreview]} />
        <View style={styles.content}>
          <View style={styles.contentData}>
            <Skeleton style={styles.skeletonTitle} />
            <Skeleton style={styles.skeletonDesc} />
            <Skeleton style={styles.skeletonDescShort} />
          </View>
        </View>
        <View style={styles.actions}>
          <Skeleton style={styles.skeletonAction} />
          <Skeleton style={styles.skeletonAction} />
        </View>
      </View>
    </View>
  );
};

const FeaturedNoteItem = ({
  note,
  subjectAvatars,
  defaultAvatar,
  isWide,
  source,
  subject,
  hideAvatar,
  includeHiddenItems,
  isVisible,
}: {
  note: TopicalNote;
  subjectAvatars: Record<string, string>;
  defaultAvatar: string;
  isWide: boolean;
  source: "home" | "library" | "pages";
  subject?: string;
  hideAvatar?: boolean;
  includeHiddenItems?: boolean;
  isVisible: boolean;
}) => {
  const { user, profile } = useProfile();
  const { colors: themeColors, isDark } = useTheme();
  const [hovered, setHovered] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{
    x: number;
    y: number;
    width: number;
    height: number;
  } | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const menuButtonRef = useRef<View>(null);
  const router = useRouter();
  const pathname = usePathname();
  const title = note.title ?? "Featured note";
  const description =
    (note.description?.length ?? 0) > 100
      ? `${note.description?.slice(0, 100)}...`
      : (note.description ?? "A fresh study note will appear here.");

  const readIds = new Set(getMarkedReadItemIds(profile));
  const isRead = readIds.has(note.id);
  const hiddenIds = new Set(
    getHiddenPageEntries(profile).map((entry) => entry.id),
  );
  const isHidden = hiddenIds.has(note.id);
  const isSaved = Boolean(user && profile?.["saved-pages"]?.includes(note.id));
  const [showGuestSaveDialog, setShowGuestSaveDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<{
    title: string;
    message: string;
    primaryText?: string;
    secondaryText?: string;
    onPrimary?: () => void;
    onSecondary?: () => void;
  } | null>(null);
  const showAuthPrompt = (title: string, message: string) => {
    setDialogState({
      title,
      message,
      primaryText: "Log in",
      secondaryText: "Sign up",
      onPrimary: () => router.push("/login" as never),
      onSecondary: () => router.push("/signup" as never),
    });
  };

  const handleOpenMenu = () => {
    menuButtonRef.current?.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x, y, width, height });
      setActiveMenuId(note.id);
    });
  };

  const handleCloseMenu = () => {
    setMenuAnchor(null);
    setActiveMenuId(null);
  };

  const handleToggleRead = async () => {
    if (!user) {
      showAuthPrompt(
        "Sign in to personalize DigiLearn",
        "Create an account or log in to save your reading progress and personalize your experience.",
      );
      return;
    }

    try {
      await togglePageReadState(user.uid, note.id, isRead);
      if (!isRead) {
        setDialogState({
          title: "Marked as read",
          message: "This page has been marked as read.",
          primaryText: "Done",
          onPrimary: () => setDialogState(null),
        });
      }
    } catch (error) {
      console.error("Failed to update read state:", error);
      setDialogState({
        title: "Couldn't update this item",
        message: "Please try again.",
        primaryText: "OK",
        onPrimary: () => setDialogState(null),
      });
    }
  };

  const handleToggleHidden = async () => {
    if (!user) {
      showAuthPrompt(
        "Sign in to manage hidden items",
        "Log in or create an account to hide pages and keep your preferences across devices.",
      );
      return;
    }

    try {
      const shouldHide = !isHidden;
      await setPageHiddenState(user.uid, note.id, shouldHide);
      if (shouldHide) {
        showNativeToast(feedbackMessages.itemHidden);
        setDialogState({
          title: "Page hidden",
          message: "Page hidden · Undo",
          primaryText: "Undo",
          onPrimary: async () => {
            setDialogState(null);
            await setPageHiddenState(user.uid, note.id, false);
            showNativeToast(feedbackMessages.itemRestored);
          },
        });
      }
    } catch (error) {
      console.error("Failed to update hidden state:", error);
      setDialogState({
        title: "Couldn't update this item",
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
        item: { type: "page", id: note.id, name: title },
      });
      setShowReportDialog(false);
      setDialogState({
        title: "Report sent",
        message:
          "Thanks. We'll review this resource and investigate the issue.",
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

  const handleToggleSave = async () => {
    if (!user) {
      setShowGuestSaveDialog(true);
      return;
    }
    try {
      await toggleSavedItem(user.uid, "saved-pages", note.id, isSaved);
      showNativeToast(
        isSaved ? feedbackMessages.itemUnsaved : feedbackMessages.itemSaved,
      );
    } catch (err) {
      console.error("Failed to toggle saved note:", err);
    }
  };

  const canDelete = Boolean(
    user && (profile?.type === "admin" || note.owner === user.uid),
  );

  const handleDelete = async () => {
    try {
      await deleteResource("pages", note.id);
    } catch (error) {
      console.error("Failed to delete page:", error);
    }
  };

  const previewSource = source ?? "home";
  const routeTitle =
    typeof subject === "string" && subject.trim().length > 0
      ? subject
      : typeof note.subject === "string" && note.subject.trim().length > 0
        ? note.subject
        : "Pages";
  const menuActions = [
    {
      label: isRead ? "Mark as unread" : "Mark as read",
      icon: isRead ? "check-circle" : "check-circle",
      accessibilityLabel: isRead
        ? "Mark this page as unread"
        : "Mark this page as read",
      onPress: handleToggleRead,
    },
    {
      label: isHidden ? "Unhide" : "Hide",
      icon: isHidden ? "eye" : "eye-off",
      accessibilityLabel: isHidden ? "Unhide this page" : "Hide this page",
      onPress: handleToggleHidden,
    },
    {
      label: "Report a problem",
      icon: "alert-circle",
      accessibilityLabel: "Report a problem with this page",
      onPress: handleReportProblem,
    },
    ...(canDelete
      ? [
          {
            label: "Delete",
            icon: "trash-2",
            accessibilityLabel: `Delete ${title}`,
            destructive: true,
            onPress: () =>
              setDialogState({
                title: "Delete this resource?",
                message:
                  "This will permanently delete the resource. This action cannot be undone.",
                primaryText: "Delete",
                secondaryText: "Cancel",
                onPrimary: handleDelete,
              }),
          },
        ]
      : []),
  ] as const;

  return (
    <>
      <Animated.View
        entering={FadeInUp.duration(420)}
        style={[styles.itemWrapper, isWide && styles.itemWrapperWide]}
      >
        <View
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
          style={[
            styles.card,
            { backgroundColor: themeColors.white },
            isDark && {
              borderTopLeftRadius: 10,
              borderTopRightRadius: 10,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            },
            hovered && { backgroundColor: themeColors.lightBackground },
          ]}
        >
          <Pressable
            style={styles.previewWrap}
            onHoverIn={() => setHovered(true)}
            onHoverOut={() => setHovered(false)}
            onPress={() => {
              if (auth.currentUser?.uid) {
                recordUserActivity(auth.currentUser.uid, "page", note.id);
              }
              router.push({
                pathname: "/page-preview",
                params: {
                  id: note.id,
                  source: previewSource,
                  returnTo: pathname,
                  title: routeTitle,
                },
              } as any);
            }}
          >
            {note.cover || note.image || note.preview ? (
              <FirebaseImage
                source={note.cover || note.image || note.preview}
                style={styles.preview}
                contentFit="cover"
              />
            ) : (
              <View
                style={[
                  styles.preview,
                  styles.previewFallback,
                  { backgroundColor: themeColors.border },
                ]}
              />
            )}
            <View style={styles.overlay} />
            {isRead ? (
              <View style={styles.readBadge}>
                <Ionicons
                  name="checkmark-done"
                  size={12}
                  color={colors.white}
                />
                <Text style={styles.readBadgeText}>Read</Text>
              </View>
            ) : null}
          </Pressable>

          <View style={styles.content}>
            <View
              style={[
                styles.contentData,
                hideAvatar && styles.contentDataNoAvatar,
              ]}
            >
              <Text style={[styles.title, { color: themeColors.text }]}>
                {title}
              </Text>
              <Text
                style={[styles.description, { color: themeColors.subtitle }]}
              >
                {description}
              </Text>
            </View>
            <Pressable
              ref={menuButtonRef}
              accessibilityRole="button"
              accessibilityLabel="More options"
              style={[
                styles.menuButton,
                { backgroundColor: themeColors.lightBackground },
              ]}
              onPress={handleOpenMenu}
            >
              <Icon
                name="more-vertical"
                size={18}
                color={themeColors.subtitle}
              />
            </Pressable>
            <CardActionMenu
              visible={activeMenuId === note.id && !!menuAnchor}
              anchor={menuAnchor}
              actions={menuActions.map((action) => ({
                ...action,
                icon: action.icon as any,
              }))}
              onClose={handleCloseMenu}
            />
          </View>

          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isSaved ? "Remove bookmark" : "Save note"}
              style={styles.actionItem}
              onPress={handleToggleSave}
            >
              <Ionicons
                name={isSaved ? "bookmark" : "bookmark-outline"}
                size={25}
                color={isSaved ? themeColors.primary : themeColors.subtitle}
              />
            </Pressable>
            <Action icon="share-2" label="Share" />
          </View>
        </View>
      </Animated.View>
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
        title="Save resources to your library"
        message="Save this resource to your personal library and access it anytime. Log in or create a free account to continue."
        primaryText="Log in"
        secondaryText="Sign up"
        onPrimary={() => router.push("/login" as never)}
        onSecondary={() => router.push("/signup" as never)}
        onClose={() => setShowGuestSaveDialog(false)}
      />
      <ReportDialog
        visible={showReportDialog}
        itemName={title}
        submitting={reportSubmitting}
        error={reportError}
        onSubmit={handleSubmitReport}
        onClose={() => setShowReportDialog(false)}
      />
    </>
  );
};

const Action = ({ icon }: { icon: any; label: string }) => {
  const { colors: themeColors } = useTheme();
  return (
    <View style={styles.actionItem}>
      <Icon name={icon} size={20} color={themeColors.subtitle} />
    </View>
  );
};

const styles = StyleSheet.create({
  list: { width: "100%" },
  listContent: { paddingBottom: spacing.xl },
  paginationStatus: {
    paddingVertical: spacing.md,
    textAlign: "center",
    color: colors.subtitle,
    fontSize: 13,
  },
  loadMoreButton: {
    alignSelf: "center",
    marginVertical: spacing.md,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: colors.dark,
  },
  loadMoreText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  listWide: { flexDirection: "column", gap: spacing.md },
  itemWrapper: { width: "100%" },
  itemWrapperWide: { width: "100%" },
  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.white,
    marginBottom: spacing.xl,
    borderRadius: 10,
    overflow: "hidden",
  },
  cardHovered: {
    backgroundColor: "#e8efffff",
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f8fb",
  },
  previewWrap: {
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.xs,
    borderRadius: 10,
  },
  preview: {
    width: "100%",
    height: 320,
  },
  previewFallback: { backgroundColor: "#D1D5DB" },
  pdfLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(209, 213, 219, 0.75)",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  readBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    borderRadius: 999,
  },
  readBadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: "600",
  },
  content: {
    flexDirection: "row",
    paddingHorizontal: spacing.xs,
  },
  contentData: { flex: 1 },
  contentDataNoAvatar: { marginLeft: 0 },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  description: { color: colors.text, fontSize: 13, lineHeight: 18 },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: 8,
    paddingBottom: spacing.xs,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 3,
  },
  actionLabel: { color: colors.subtitle, fontSize: 12, fontWeight: "500" },
  skeletonPreview: { height: 320, marginBottom: spacing.sm },
  skeletonTitle: { height: 16, width: "60%", marginBottom: 8 },
  skeletonDesc: { height: 12, width: "90%", marginBottom: 6 },
  skeletonDescShort: { height: 12, width: "40%" },
  skeletonAction: { width: 28, height: 28, borderRadius: 14 },
});
