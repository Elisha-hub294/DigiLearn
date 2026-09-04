import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";
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
  const meta = NOTIFICATION_TYPE_META[notification.type];
  const resourceTitle = notification.resourceTitle?.trim();
  const previewImage = notification.previewImage?.trim();
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);

  const shouldRenderPreviewImage =
    Boolean(previewImage) && failedPreviewUrl !== previewImage;

  return (
    <View
      style={[
        styles.card,
        notification.read ? styles.readCard : styles.unreadCard,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open notification: ${notification.message}`}
        onPress={() => onPress(notification)}
        style={({ pressed }) => [
          styles.mainPressable,
          pressed && styles.pressed,
        ]}
      >
        <View style={styles.avatarWrap}>
          <Image
            source={resolveNotificationAvatarSource(
              notification.publisherAvatar,
            )}
            style={styles.avatar}
            contentFit="cover"
          />
        </View>

        <View style={styles.content}>
          <Text style={styles.heading} numberOfLines={1}>
            <Text style={styles.publisher}>{notification.publisherName}</Text>
            <Text style={styles.separator}> · </Text>
            <Text style={styles.time}>
              {formatRelativeNotificationTime(notification.createdAt)}
            </Text>
          </Text>
          <Text style={styles.message} numberOfLines={1}>
            {notification.message}
          </Text>
          {resourceTitle ? (
            <Text style={styles.resourceTitle} numberOfLines={1}>
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
              accessibilityLabel={`${meta.label} notification icon`}
              style={[
                styles.typeIconWrap,
                { backgroundColor: meta.background },
              ]}
            >
              <MaterialCommunityIcons
                name={meta.icon as any}
                size={22}
                color={colors.white}
              />
            </View>
          )}
        </View>
      </Pressable>

      {!notification.read && onMarkRead ? (
        <Pressable
          onPress={() => onMarkRead(notification.id)}
          style={({ pressed }) => [
            styles.markReadButton,
            pressed && styles.markReadPressed,
          ]}
          accessibilityLabel="Mark as read"
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="check" size={20} color={colors.dark} />
        </Pressable>
      ) : null}
    </View>
  );
}

export function NotificationSectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionLabel}>{label}</Text>;
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
  unreadCard: {
    backgroundColor: "#DCE9FA",
    borderColor: "#B8CBE7",
  },
  readCard: {
    backgroundColor: "#f0f0f0",
    borderColor: "#e0e0e0",
  },
  pressed: {
    opacity: 0.96,
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
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  markReadPressed: {
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
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
