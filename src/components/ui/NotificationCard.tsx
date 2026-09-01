import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
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
  const showIcon = notification.type !== "announcement";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Open notification: ${notification.message}`}
      onPress={() => onPress(notification)}
      style={({ pressed }) => [
        styles.card,
        notification.read ? styles.readCard : styles.unreadCard,
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.avatarWrap}>
        <Image
          source={resolveNotificationAvatarSource(notification.publisherAvatar)}
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
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
      </View>

      <View style={styles.actionsWrap}>
        {showIcon ? (
          <View
            accessibilityLabel={`${meta.label} notification icon`}
            style={[styles.typeIconWrap, { backgroundColor: meta.background }]}
          >
            <MaterialCommunityIcons
              name={meta.icon as any}
              size={22}
              color={colors.white}
            />
          </View>
        ) : null}

        {!notification.read && onMarkRead ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onMarkRead(notification.id);
            }}
            style={({ pressed }) => [
              styles.markReadButton,
              pressed && styles.markReadPressed,
            ]}
            accessibilityLabel="Mark as read"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="check"
              size={20}
              color={colors.dark}
            />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
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
    backgroundColor: "#E8E8E8",
    borderColor: "#D3D3D3",
  },
  pressed: {
    opacity: 0.96,
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
    fontWeight: "500",
    color: "#4B5563",
  },
  actionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  typeIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
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
