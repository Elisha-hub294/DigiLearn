import { Feather as Icon } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { formatActivityDate } from "../../services/activityService";
import { ActivityItem, ActivityType } from "../../types/activity";

type ActivityCardProps = {
  item: ActivityItem;
  onPress?: () => void;
};

const PANEL_CONFIG: Record<
  ActivityType,
  { bg: string; icon: keyof typeof Icon.glyphMap }
> = {
  lesson: {
    bg: "#9658B7",
    icon: "play",
  },
  page: {
    bg: "#3B82F6",
    icon: "file-text",
  },
  book: {
    bg: "#FF646A",
    icon: "book-open",
  },
  paper: {
    bg: "#10B981",
    icon: "file-text",
  },
};

export const ActivityCard: React.FC<ActivityCardProps> = ({
  item,
  onPress,
}) => {
  const config = PANEL_CONFIG[item.type] || PANEL_CONFIG.page;
  const formattedDate = formatActivityDate(item.openedAt);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.cardContainer, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`${item.title}, ${item.type} activity, opened ${formattedDate}`}
    >
      {/* Left Icon Panel */}
      <View style={[styles.iconPanel, { backgroundColor: config.bg }]}>
        <Icon name={config.icon} size={26} color="#FFFFFF" />
      </View>

      {/* Right Information Section */}
      <View style={styles.infoSection}>
        <View style={styles.topInfo}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>
          <Text
            style={styles.description}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.description}
          </Text>
        </View>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: "100%",
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 10,
  },
  pressed: {
    opacity: 0.88,
    transform: [{ scale: 0.995 }],
  },
  iconPanel: {
    width: 80,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  infoSection: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingLeft: 10,
    paddingRight: 12,
    paddingTop: 8,
    paddingBottom: 7,
    justifyContent: "space-between",
  },
  topInfo: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
    marginBottom: 2,
  },
  description: {
    fontSize: 10.5,
    color: "#6B6B6B",
    lineHeight: 15,
  },
  dateText: {
    fontSize: 9.5,
    color: "#555555",
    marginTop: 2,
  },
});

export default ActivityCard;
