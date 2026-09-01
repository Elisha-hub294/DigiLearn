import { Feather as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useMemo } from "react";
import {
  Alert,
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
  deleteNotification,
  getNotificationSections,
} from "../services/notifications";

export default function NotificationsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, notifications, loading, error, markRead } = useNotifications();
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

  const sections = useMemo(
    () => getNotificationSections(notifications),
    [notifications],
  );

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
        Alert.alert("Unavailable", "This content is no longer available.", [
          {
            text: "Dismiss",
            onPress: () => handleDeleteNotification(notification.id),
          },
        ]);
        return;
      }

      if (notification.type === "announcement") {
        const teacherName = notification.publisherName.replace(/^Tr\.\s*/i, "");
        if (notification.itemId) {
          router.push({
            pathname: "/teacher-profile",
            params: { name: teacherName },
          } as never);
        }

        if (user && !notification.read) {
          await markRead(notification.id);
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
        itemPath = "/pdf-reader";
      }

      try {
        const ref = doc(
          db,
          notification.collection ?? "books",
          notification.itemId,
        );
        const snapshot = await getDoc(ref);

        if (!snapshot.exists()) {
          Alert.alert("Unavailable", "This content is no longer available.", [
            {
              text: "Dismiss",
              onPress: () => handleDeleteNotification(notification.id),
            },
          ]);
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
            typeof paperData.document === "string" ? paperData.document : undefined;

          router.push({
            pathname: itemPath,
            params: {
              id: notification.itemId,
              title:
                typeof paperData.title === "string"
                  ? paperData.title
                  : undefined,
              uri: paperDocument ? encodeURIComponent(paperDocument) : undefined,
              document: paperDocument,
              cover:
                typeof paperData.cover === "string"
                  ? paperData.cover
                  : undefined,
              description:
                typeof paperData.description === "string"
                  ? paperData.description
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
        Alert.alert("Unavailable", "This content is no longer available.", [
          {
            text: "Dismiss",
            onPress: () => handleDeleteNotification(notification.id),
          },
        ]);
      }
    },
    [markRead, router, user, handleDeleteNotification],
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
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
