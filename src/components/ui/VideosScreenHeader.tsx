import { SearchBar } from "@/components/ui/SearchBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SubjectFilter } from "@/components/ui/SubjectFilter";
import { TrendingCarousel } from "@/components/ui/TrendingCarousel";
import { VideoLesson } from "@/components/ui/TrendingVideoCard";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../constants/theme";
import { useNotifications } from "../../hooks/useNotifications";

type VideosScreenHeaderProps = {
  subject: string;
  setSubject: (subject: string) => void;
  loading: boolean;
  trendingLessons: VideoLesson[];
  cardWidth: number;
};

export const VideosScreenHeader: React.FC<VideosScreenHeaderProps> = ({
  subject,
  setSubject,
  loading,
  trendingLessons,
  cardWidth,
}) => {
  const router = useRouter();
  const { hasUnread } = useNotifications();

  return (
    <>
      <View style={styles.topRow}>
        <Text style={styles.pageTitle}>Lessons</Text>
        <Pressable
          accessibilityLabel="Open notifications"
          accessibilityRole="button"
          hitSlop={10}
          style={styles.bell}
          onPress={() => router.push("/notifications" as any)}
        >
          <Ionicons name="play-outline" size={30} color={colors.dark} />
          {hasUnread ? <View style={styles.dot} /> : null}
        </Pressable>
      </View>
      <SearchBar />
      <View>
        <SubjectFilter selected={subject} onSelect={setSubject} />
      </View>
      <View style={styles.section}>
        <SectionHeader title="Trending ⚡" />
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <TrendingCarousel items={trendingLessons} cardWidth={cardWidth} />
        )}
      </View>
      <View style={styles.latestHeading}>
        <SectionHeader title="Latest" />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  topRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    paddingTop: 8,
  },
  pageTitle: {
    color: "#111",
    fontSize: 34,
    fontWeight: "500",
    letterSpacing: -1,
  },
  bell: { padding: 0, position: "relative" },
  dot: {
    backgroundColor: "#FF3B30",
    borderColor: "#fff",
    borderRadius: 5,
    borderWidth: 1.5,
    height: 10,
    position: "absolute",
    right: 4,
    top: 3,
    width: 10,
  },
  section: { marginTop: 30 },
  latestHeading: { marginTop: 34 },
  loader: { alignItems: "center", justifyContent: "center", minHeight: 120 },
});
