import { Feather as Icon } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BackHandler,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { db } from "../../firebaseConfig";
import { ActionDialog } from "../components/ui/ActionDialog";
import {
  NotificationCard,
  NotificationSectionHeader,
} from "../components/ui/NotificationCard";
import { NotificationEmptyState } from "../components/ui/NotificationEmptyState";
import { NotificationSkeleton } from "../components/ui/NotificationSkeleton";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { useNotifications } from "../hooks/useNotifications";
import {
  NotificationRecord,
  NotificationType,
  deleteNotification,
  getNotificationSections,
} from "../services/notifications";

const notificationTypes = new Set<NotificationType>([
  "book",
  "lesson",
  "page",
  "paper",
  "announcement",
]);

export default function NotificationsScreen() {
  const router = useRouter();
  const { types } = useLocalSearchParams<{ types?: string }>();
  const { width } = useWindowDimensions();
  const { user, notifications, loading, error, markRead, markAllRead } =
    useNotifications();
  const [unavailableDialog, setUnavailableDialog] = useState<{
    visible: boolean;
    notificationId: string | null;
  }>({ visible: false, notificationId: null });
  const horizontalPadding = getHorizontalPadding(width);
  const maxWidth = Math.min(1100, width - horizontalPadding * 2);

  useEffect(() => {
    const callback = () => {
      router.back();
      return true;
    };

    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      callback,
    );
    return () => subscription.remove();
  }, [router]);

  const sections = useMemo(() => {
    const allowedTypes = new Set(
      (types ?? "")
        .split(",")
        .filter((type): type is NotificationType =>
          notificationTypes.has(type as NotificationType),
        ),
    );
    const visibleNotifications = allowedTypes.size
      ? notifications.filter((notification) =>
          allowedTypes.has(notification.type),
        )
      : notifications;

    return getNotificationSections(visibleNotifications);
  }, [notifications, types]);

  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  }, [router]);

  const handleMarkRead = useCallback(
    (notificationId: string) => {
      markRead(notificationId);
    },
    [markRead],
  );

  const handleDeleteNotification = useCallback(
    async (notificationId: string) => {
      if (!user) return;
      try {
        await deleteNotification(user.uid, notificationId);
      } catch (error) {
        console.error("Failed to delete notification:", error);
      }
    },
    [user],
  );

  const openItem = useCallback(
    async (notification: NotificationRecord) => {
      if (!notification.itemId) {
        setUnavailableDialog({
          visible: true,
          notificationId: notification.id,
        });
        return;
      }

      if (notification.storage === "admin") {
        try {
          if (notification.adminKind === "report") {
            router.push("/admin-reports" as never);
            if (user && !notification.read) await markRead(notification.id);
            return;
          }
          const snapshot = await getDoc(
            doc(db, "teacherApplications", notification.itemId),
          );

          if (!snapshot.exists()) {
            setUnavailableDialog({
              visible: true,
              notificationId: notification.id,
            });
            return;
          }

          router.push({
            pathname: "/teacher-application-review",
            params: { applicationId: notification.itemId },
          } as never);
          if (user && !notification.read) await markRead(notification.id);
        } catch {
          setUnavailableDialog({
            visible: true,
            notificationId: notification.id,
          });
        }
        return;
      }

      if (notification.type === "announcement") {
        const teacherName = notification.publisherName.replace(/^Tr\.\s*/i, "");
        try {
          const snapshot = await getDoc(
            doc(db, notification.collection ?? "users", notification.itemId),
          );

          if (!snapshot.exists()) {
            setUnavailableDialog({
              visible: true,
              notificationId: notification.id,
            });
            return;
          }

          router.push({
            pathname: "/teacher-profile",
            params: { name: teacherName },
          } as never);

          if (user && !notification.read) await markRead(notification.id);
        } catch {
          setUnavailableDialog({
            visible: true,
            notificationId: notification.id,
          });
        }
        return;
      }

      let itemPath = "/book-preview";
      if (notification.type === "book") {
        itemPath = "/book-preview";
      } else if (notification.type === "lesson") {
        itemPath = "/lesson-player";
      } else if (notification.type === "page") {
        itemPath = "/page-preview";
      } else if (notification.type === "paper") {
        itemPath = "/paper-preview";
      }

      try {
        const ref = doc(
          db,
          notification.collection ?? "books",
          notification.itemId,
        );
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
          setUnavailableDialog({
            visible: true,
            notificationId: notification.id,
          });
          return;
        }

        if (notification.type === "book") {
          router.push({
            pathname: itemPath,
            params: {
              id: notification.itemId,
              source: "notifications",
              returnTo: "/notifications",
            },
          } as never);
        } else if (notification.type === "lesson") {
          const lessonData = snapshot.data() as Record<string, unknown>;
          router.push({
            pathname: itemPath,
            params: {
              id: notification.itemId,
              title:
                typeof lessonData.title === "string"
                  ? lessonData.title
                  : undefined,
              teacher:
                typeof lessonData.teacher === "string"
                  ? lessonData.teacher
                  : undefined,
              subject:
                typeof lessonData.subject === "string"
                  ? lessonData.subject
                  : undefined,
              duration:
                typeof lessonData.duration === "string"
                  ? lessonData.duration
                  : undefined,
              uploadedAt:
                typeof lessonData.uploadedAt === "string"
                  ? lessonData.uploadedAt
                  : undefined,
              link:
                typeof lessonData.link === "string"
                  ? lessonData.link
                  : undefined,
              thumbnail:
                typeof lessonData.thumbnail === "string"
                  ? lessonData.thumbnail
                  : undefined,
              avatar:
                typeof lessonData.avatar === "string"
                  ? lessonData.avatar
                  : undefined,
            },
          } as never);
        } else if (notification.type === "paper") {
          const paperData = snapshot.data() as Record<string, unknown>;
          const paperDocument =
            typeof paperData.document === "string"
              ? paperData.document
              : undefined;

          router.push({
            pathname: itemPath,
            params: {
              id: notification.itemId,
              title:
                typeof paperData.title === "string"
                  ? paperData.title
                  : undefined,
              subject:
                typeof paperData.subject === "string"
                  ? paperData.subject
                  : undefined,
              year:
                typeof paperData.year === "string"
                  ? paperData.year
                  : typeof paperData.year === "number"
                    ? String(paperData.year)
                    : undefined,
              description:
                typeof paperData.description === "string"
                  ? paperData.description
                  : undefined,
              level:
                typeof paperData.level === "string"
                  ? paperData.level
                  : undefined,
              pageNumber:
                typeof paperData.pageNumber === "string" ||
                typeof paperData.pageNumber === "number"
                  ? String(paperData.pageNumber)
                  : typeof paperData.pages === "string" ||
                      typeof paperData.pages === "number"
                    ? String(paperData.pages)
                    : undefined,
              paperCode:
                typeof paperData.paperCode === "string"
                  ? paperData.paperCode
                  : undefined,
              paperNumber:
                typeof paperData.paperNumber === "string" ||
                typeof paperData.paperNumber === "number"
                  ? String(paperData.paperNumber)
                  : typeof paperData.number === "string" ||
                      typeof paperData.number === "number"
                    ? String(paperData.number)
                    : undefined,
              image:
                typeof paperData.cover === "string"
                  ? paperData.cover
                  : typeof paperData.image === "string"
                    ? paperData.image
                    : typeof paperData.coverImage === "string"
                      ? paperData.coverImage
                      : undefined,
              document: paperDocument,
              type:
                typeof paperData.type === "string"
                  ? paperData.type
                  : typeof paperData.examType === "string"
                    ? paperData.examType
                    : typeof paperData.paperType === "string"
                      ? paperData.paperType
                      : undefined,
            },
          } as never);
        } else {
          router.push({
            pathname: itemPath,
            params: { id: notification.itemId },
          } as never);
        }

        if (user && !notification.read) {
          await markRead(notification.id);
        }
      } catch {
        setUnavailableDialog({
          visible: true,
          notificationId: notification.id,
        });
      }
    },
    [markRead, router, user],
  );

  if (!user && !loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.page, { maxWidth }]}>
          <View
            style={[styles.content, { paddingHorizontal: horizontalPadding }]}
          >
            <View style={styles.headerRow}>
              <Pressable
                onPress={handleBack}
                style={styles.backButton}
                accessibilityLabel="Back"
              >
                <Icon name="arrow-left" size={22} color={colors.dark} />
              </Pressable>
              <Text style={styles.title}>Notifications</Text>
            </View>
            <View style={styles.emptyContainer}>
              <NotificationEmptyState
                title="Stay up to date"
                description="Log in or sign up to receive updates about new books, lessons, pages, and announcements."
                actionLabel="Log in / Sign up"
                onPressAction={() => router.push("/welcome")}
              />
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ActionDialog
        visible={unavailableDialog.visible}
        title="Unavailable"
        message="This content is no longer available."
        primaryText="Dismiss"
        onPrimary={() => {
          setUnavailableDialog({ visible: false, notificationId: null });
          if (unavailableDialog.notificationId) {
            void handleDeleteNotification(unavailableDialog.notificationId);
          }
        }}
        onClose={() =>
          setUnavailableDialog({ visible: false, notificationId: null })
        }
      />
      <View style={[styles.page, { maxWidth }]}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: horizontalPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable
              onPress={handleBack}
              style={styles.backButton}
              accessibilityLabel="Back"
            >
              <Icon name="arrow-left" size={22} color={colors.dark} />
            </Pressable>
            <Text style={styles.title}>Notifications</Text>
            {notifications.some((notification) => !notification.read) ? (
              <Pressable
                onPress={() => void markAllRead()}
                accessibilityLabel="Mark all notifications as read"
                style={styles.markAllButton}
              >
                <Text style={styles.markAllText}>Mark all read</Text>
              </Pressable>
            ) : null}
          </View>

          {loading ? (
            <NotificationSkeleton />
          ) : error ? (
            <NotificationEmptyState
              title="Something went wrong"
              description={error}
            />
          ) : notifications.length === 0 ? (
            <NotificationEmptyState
              title="You're all caught up"
              description="New books, lessons, pages, and announcements will appear here when they're available."
            />
          ) : (
            <>
              {sections.unread.length > 0 ? (
                <>
                  <NotificationSectionHeader label="Unread" />
                  {sections.unread.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onPress={openItem}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                </>
              ) : null}

              {sections.read.length > 0 ? (
                <>
                  <NotificationSectionHeader label="Read" />
                  {sections.read.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onPress={openItem}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                </>
              ) : null}

              {sections.earlier.length > 0 ? (
                <>
                  <NotificationSectionHeader label="Earlier" />
                  {sections.earlier.map((notification) => (
                    <NotificationCard
                      key={notification.id}
                      notification={notification}
                      onPress={openItem}
                      onMarkRead={handleMarkRead}
                    />
                  ))}
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  page: {
    flex: 1,
    alignSelf: "center",
    width: "100%",
  },
  scroll: {
    flex: 1,
    width: "100%",
  },
  content: {
    flexGrow: 1,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    width: "100%",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  backButton: {
    marginRight: spacing.md,
    padding: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: colors.dark,
    letterSpacing: -0.6,
  },
  markAllButton: {
    marginLeft: "auto",
    paddingVertical: 7,
    paddingHorizontal: 10,
  },
  markAllText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
