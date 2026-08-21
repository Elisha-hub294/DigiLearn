import { Header } from "@/components/ui/Header";
import { SearchBar } from "@/components/ui/SearchBar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SubjectFilter } from "@/components/ui/SubjectFilter";
import { TrendingCarousel } from "@/components/ui/TrendingCarousel";
import { VideoLesson } from "@/components/ui/TrendingVideoCard";
import React from "react";
import { ActivityIndicator, LayoutChangeEvent, StyleSheet, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, spacing } from "../../constants/theme";

type VideosScreenHeaderProps = {
  subject: string;
  setSubject: (subject: string) => void;
  loading: boolean;
  trendingLessons: VideoLesson[];
  cardWidth: number;
  onTrendingSectionLayout?: (y: number) => void;
};

export const VideosScreenHeader: React.FC<VideosScreenHeaderProps> = ({
  subject,
  setSubject,
  loading,
  trendingLessons,
  cardWidth,
  onTrendingSectionLayout,
}) => {
  const handleTrendingLayout = (event: LayoutChangeEvent) => {
    onTrendingSectionLayout?.(event.nativeEvent.layout.y);
  };
  return (
    <>
      <Animated.View entering={FadeInUp.duration(320)} style={styles.headerWrap}>
        <Header title="Videos" rightIconName="video" />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(360)}>
        <SearchBar placeholder="Search Lessons" category="Videos" />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(400)} style={styles.filterSection}>
        <SubjectFilter selected={subject} onSelect={setSubject} />
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(440)} style={styles.section}>

        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <TrendingCarousel items={trendingLessons} cardWidth={cardWidth} />
        )}
      </Animated.View>

      <Animated.View entering={FadeInUp.duration(480)} style={styles.section} onLayout={handleTrendingLayout}>
        <SectionHeader
          title="Trending Lessons"
        />
      </Animated.View>
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
});

