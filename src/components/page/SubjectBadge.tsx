import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { useFirebaseStorageUrl } from "../../utils/firebaseStorage";
import { DEFAULT_SUBJECT_AVATAR } from "./pageTypes";

export function SubjectBadge({
  avatarUrl,
  title,
  dateText,
  subjects = [],
  pagesCount,
  isRecommended,
  isRecentlyUpdated,
  accentColor = "#000000",
}: {
  avatarUrl?: string;
  title: string;
  dateText: string;
  subjects?: string[];
  pagesCount?: string | number;
  isRecommended?: boolean;
  isRecentlyUpdated?: boolean;
  accentColor?: string;
}) {
  const avatarSource = avatarUrl || DEFAULT_SUBJECT_AVATAR;
  const resolvedAvatarUrl = useFirebaseStorageUrl(avatarSource) || avatarSource;
  const resolvedPlaceholderUrl = useFirebaseStorageUrl(DEFAULT_SUBJECT_AVATAR) || DEFAULT_SUBJECT_AVATAR;
  const activeAccent = accentColor || "#000000";

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <Animated.View entering={ZoomIn.duration(400)} style={styles.avatarWrap}>
          <Image
            source={{ uri: resolvedAvatarUrl }}
            placeholder={{ uri: resolvedPlaceholderUrl }}
            style={styles.avatar}
            contentFit="contain"
            transition={200}
          />
        </Animated.View>

        <View style={styles.infoBlock}>
          <Text style={[styles.title, { color: activeAccent }]} numberOfLines={2}>
            {title}
          </Text>
          <Text style={styles.dateText} numberOfLines={1}>
            {dateText}
          </Text>
        </View>
      </View>

      {/* Badges and Subject Chips */}
      <View style={styles.badgesRow}>
        {pagesCount ? (
          <View style={styles.pageBadge}>
            <Feather name="file-text" size={13} color={activeAccent} />
            <Text style={[styles.pageBadgeText, { color: activeAccent }]}>
              {pagesCount} Pages
            </Text>
          </View>
        ) : null}

        {isRecommended ? (
          <View style={styles.recommendedBadge}>
            <Feather name="star" size={12} color="#D97706" />
            <Text style={styles.recommendedText}>Recommended for you</Text>
          </View>
        ) : null}

        {isRecentlyUpdated ? (
          <View style={styles.recentBadge}>
            <Feather name="clock" size={12} color="#059669" />
            <Text style={styles.recentText}>Recently updated</Text>
          </View>
        ) : null}

        {subjects.map((sub) => (
          <View key={sub} style={styles.chip}>
            <Text style={styles.chipText}>{sub}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: 28,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 18,
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  infoBlock: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 28,
  },
  dateText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#777777",
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  pageBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#F4F0FF",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pageBadgeText: {
    fontWeight: "600",
    fontSize: 12,
  },
  recommendedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEF3C7",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recommendedText: {
    color: "#B45309",
    fontWeight: "600",
    fontSize: 12,
  },
  recentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#D1FAE5",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  recentText: {
    color: "#047857",
    fontWeight: "600",
    fontSize: 12,
  },
  chip: {
    backgroundColor: "#EEF7F3",
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    color: "#147B5B",
    fontWeight: "600",
    fontSize: 12,
  },
});
