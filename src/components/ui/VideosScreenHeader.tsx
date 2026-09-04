import { Header } from "@/components/ui/Header";
import { SearchBar } from "@/components/ui/SearchBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { SubjectFilter } from "@/components/ui/SubjectFilter";
import { TrendingCarousel } from "@/components/ui/TrendingCarousel";
import { VideoLesson } from "@/components/ui/TrendingVideoCard";
import React from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { spacing } from "../../constants/theme";

type VideosScreenHeaderProps = {
  subject: string;
  setSubject: (subject: string) => void;
  loading: boolean;
  lessons: VideoLesson[];
  trendingLessons: VideoLesson[];
  cardWidth: number;
  onTrendingSectionLayout?: (y: number) => void;
};

export const VideosScreenHeader: React.FC<VideosScreenHeaderProps> = ({
  subject,
  setSubject,
  loading,
  lessons,
  trendingLessons,
  cardWidth,
  onTrendingSectionLayout,
}) => {
  const handleTrendingLayout = (event: LayoutChangeEvent) => {
    onTrendingSectionLayout?.(event.nativeEvent.layout.y);
  };
  return (
    <>
      <Animated.View
        entering={FadeInUp.duration(320)}
        style={styles.headerWrap}
      >
        <Header
          title="Videos"
          rightIconName="video"
          notificationTypes={["lesson"]}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(360)}>
        <SearchBar placeholder="Search Lessons" category="Videos" hideChips />
      </Animated.View>

      <Animated.View
        entering={FadeInUp.duration(400)}
        style={styles.filterSection}
      >
        <SubjectFilter
          selected={subject}
          onSelect={setSubject}
          resourceItems={lessons}
        />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(440)} style={styles.section}>
        {loading ? (
          <View
            style={styles.skeletonRow}
            accessibilityLabel="Loading trending lessons"
          >
            {[0, 1, 2].map((item) => (
              <View
                key={item}
                style={[styles.skeletonCard, { width: cardWidth }]}
              >
                <Skeleton style={styles.skeletonImage} />
                <Skeleton style={styles.skeletonTitle} />
                <Skeleton style={styles.skeletonLine} />
              </View>
            ))}
          </View>
        ) : (
          <TrendingCarousel items={trendingLessons} cardWidth={cardWidth} />
        )}
      </Animated.View>

      {trendingLessons.length > 0 && (
        <Animated.View
          entering={FadeInUp.duration(480)}
          style={styles.section}
          onLayout={handleTrendingLayout}
        >
          <SectionHeader title="Trending Lessons" />
        </Animated.View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  headerWrap: {
    marginBottom: spacing.lg,
  },
  filterSection: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  loader: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
  },
  skeletonRow: { flexDirection: "row", gap: spacing.md, overflow: "hidden" },
  skeletonCard: { gap: spacing.sm },
  skeletonImage: { width: "100%", height: 132, borderRadius: 8 },
  skeletonTitle: { width: "82%", height: 14 },
  skeletonLine: { width: "52%", height: 11 },
});
