import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";
import {
  formatRelativeNotificationTime,
  NOTIFICATION_TYPE_META,
  NotificationRecord,
  resolveNotificationAvatarSource,
} from "../../services/notifications";

type NotificationCardProps = {
  notification: NotificationRecord;
  onPress: (notification: NotificationRecord) => void;
  onMarkRead?: (notificationId: string) => void;
};

export function NotificationCard({
  notification,
  onPress,
  onMarkRead,
}: NotificationCardProps) {
  const { colors: themeColors, isDark } = useTheme();
  const meta = NOTIFICATION_TYPE_META[notification.type];
  const adminNotification = notification.storage === "admin";
  const teacherApplicationNotification =
    adminNotification && notification.adminKind === "teacher-application";
  const teacherCommunityNotification =
    notification.notificationKind === "teacher-community";
  const resourceTitle = notification.resourceTitle?.trim();
  const previewImage = notification.previewImage?.trim();
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);

  const shouldRenderPreviewImage =
    Boolean(previewImage) && failedPreviewUrl !== previewImage;

  return (
    <View
      style={[
        styles.card,
        adminNotification && styles.adminCard,
        teacherApplicationNotification && styles.teacherApplicationCard,
        notification.read
          ? [
              styles.readCard,
              {
                backgroundColor: themeColors.lightBackground,
                borderColor: themeColors.border,
              },
            ]
          : [
              styles.unreadCard,
              {
                backgroundColor: themeColors.primaryLight,
                borderColor: themeColors.border,
              },
            ],
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open notification: ${notification.message}`}
        onPress={() => onPress(notification)}
        style={({ pressed, hovered }) => [
          styles.mainPressable,
          hovered && styles.hovered,
          pressed && styles.pressed,
        ]}
      >
        <View
          style={[
            styles.avatarWrap,
            adminNotification && styles.adminAvatar,
            teacherApplicationNotification && styles.teacherApplicationAvatar,
          ]}
        >
          {adminNotification ? (
            <MaterialCommunityIcons
              name={
                teacherApplicationNotification
                  ? "school-outline"
                  : "shield-alert-outline"
              }
              size={22}
              color={teacherApplicationNotification ? "#1D4ED8" : "#B45309"}
            />
          ) : (
            <Image
              source={resolveNotificationAvatarSource(
                notification.publisherAvatar,
                isDark,
              )}
              style={styles.avatar}
              contentFit="cover"
            />
          )}
        </View>

        <View style={styles.content}>
          <Text
            style={[styles.heading, { color: themeColors.dark }]}
            numberOfLines={1}
          >
            <Text style={[styles.publisher, { color: themeColors.dark }]}>
              {notification.publisherName}
            </Text>
            <Text style={[styles.separator, { color: themeColors.subtitle }]}>
              {" "}
              ·{" "}
            </Text>
            <Text style={[styles.time, { color: themeColors.subtitle }]}>
              {formatRelativeNotificationTime(notification.createdAt)}
            </Text>
          </Text>
          {teacherCommunityNotification && notification.publisherSchool ? (
            <Text
              style={[styles.school, { color: themeColors.subtitle }]}
              numberOfLines={1}
            >
              {notification.publisherSchool}
            </Text>
          ) : null}
          <Text
            style={[styles.message, { color: themeColors.text }]}
            numberOfLines={1}
          >
            {notification.message}
          </Text>
          {resourceTitle ? (
            <Text
              style={[styles.resourceTitle, { color: themeColors.primary }]}
              numberOfLines={1}
            >
              {resourceTitle}
            </Text>
          ) : null}
        </View>

        <View style={styles.actionsWrap}>
          {shouldRenderPreviewImage ? (
            <View style={styles.typeIconWrap}>
              <Image
                source={{ uri: previewImage }}
                style={styles.previewImage}
                contentFit="cover"
                contentPosition="top left"
                onError={() => {
                  if (previewImage) {
                    setFailedPreviewUrl(previewImage);
                  }
                }}
              />
            </View>
          ) : (
            <View
              accessibilityLabel={
                teacherApplicationNotification
                  ? "Teacher application notification icon"
                  : adminNotification
                    ? "Report notification icon"
                    : `${meta.label} notification icon`
              }
              style={[
                styles.typeIconWrap,
                {
                  backgroundColor: adminNotification
                    ? teacherApplicationNotification
                      ? "#2563EB"
                      : "#B45309"
                    : meta.background,
                },
              ]}
            >
              <MaterialCommunityIcons
                name={
                  teacherApplicationNotification ||
                  notification.notificationKind === "teacher-review" ||
                  notification.notificationKind === "teacher-community"
                    ? "school-outline"
                    : adminNotification
                      ? "flag"
                      : (meta.icon as any)
                }
                size={22}
                color={colors.white}
              />
            </View>
          )}
        </View>
      </Pressable>

      {!notification.read &&
      onMarkRead &&
      notification.adminKind !== "report" ? (
        <Pressable
          onPress={() => onMarkRead(notification.id)}
          style={({ pressed }) => [
            styles.markReadButton,
            { backgroundColor: themeColors.background },
            pressed && styles.markReadPressed,
          ]}
          accessibilityLabel="Mark as read"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons
            name="check"
            size={20}
            color={themeColors.dark}
          />
        </Pressable>
      ) : null}
    </View>
  );
}

export function NotificationSectionHeader({ label }: { label: string }) {
  const { colors: themeColors } = useTheme();
  return (
    <Text style={[styles.sectionLabel, { color: themeColors.dark }]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 10,
  },
  unreadCard: {},
  readCard: {},
  adminCard: { borderLeftWidth: 4, borderLeftColor: "#B45309" },
  teacherApplicationCard: { borderLeftColor: "#2563EB" },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  hovered: {
    opacity: 0.98,
    transform: [{ scale: 1.01 }],
  },
  mainPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: "hidden",
    marginRight: 12,
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  adminAvatar: {
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
  },
  teacherApplicationAvatar: { backgroundColor: "#DBEAFE" },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  heading: {
    fontSize: 13,
    lineHeight: 16,
    marginBottom: 4,
    color: colors.dark,
  },
  publisher: {
    fontWeight: "700",
    color: colors.dark,
  },
  separator: {
    color: colors.subtitle,
  },
  time: {
    color: colors.subtitle,
    fontWeight: "500",
  },
  message: {
    fontSize: 13,
    lineHeight: 17,
    fontWeight: "600",
    color: "#1F2937",
  },
  school: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 2,
  },
  resourceTitle: {
    maxWidth: "86%",
    fontSize: 11,
    lineHeight: 16,
    color: colors.primary,
    marginTop: 2,
    textTransform: "capitalize",
  },
  actionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    marginRight: 5,
  },
  previewImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  markReadButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  markReadPressed: {},
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.8,
    color: colors.dark,
    marginBottom: 10,
    marginTop: 6,
    textTransform: "uppercase",
  },
});
