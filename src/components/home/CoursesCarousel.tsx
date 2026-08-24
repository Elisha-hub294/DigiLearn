import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, radius, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTrendingLessons } from "../../hooks/useTrendingLessons";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../../utils/interestFilter";
import { resolveVideoImageSource } from "../../utils/videoUtils";
import { SectionHeader } from "../ui/SectionHeader";

const AUTO_SCROLL_INTERVAL_MS = 4500;
const RESUME_DELAY_MS = 5000;
const CARD_GAP = spacing.md; // matches marginRight on each card

const CourseCardImage = ({
  thumbnail,
  link,
}: {
  thumbnail?: string;
  link?: string;
}) => {
  const primarySource = useMemo(
    () => resolveVideoImageSource(thumbnail, link),
    [thumbnail, link],
  );
  const [source, setSource] = useState(primarySource);

  useEffect(() => {
    setSource(primarySource);
  }, [primarySource]);

  return (
    <Image
      source={source}
      style={styles.image}
      contentFit="cover"
      onError={() => {
        setSource(require("../../../assets/images/thumb-default.jpeg"));
      }}
    />
  );
};

export const CoursesCarousel = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const { lessons, loading, error } = useTrendingLessons();
  const cardWidth = width >= 900 ? 240 : 220;
  const itemStep = cardWidth + CARD_GAP;

  const filteredLessons = useMemo(() => {
    if (!shouldFilterByInterests(profile)) return lessons;
    return lessons.filter((lesson: any) =>
      matchesUserInterests(lesson.subject ?? lesson.title, profile?.subjects),
    );
  }, [lessons, profile]);

  // Shuffle lessons to display in random order each load
  const shuffledLessons = useMemo(() => {
    const arr = [...filteredLessons];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, [filteredLessons]);

  // Use shuffled lessons for a single list (no duplication)
  const data = useMemo(
    () => shuffledLessons.map((l, i) => ({ ...l, _key: `a-${l.id}-${i}` })),
    [shuffledLessons],
  );

  const listRef = useRef<FlatList>(null);
  const offsetRef = useRef(0);
  const isUserScrolling = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);

  // No special layout needed for single list
  const onLayout = useCallback(() => {
    // Ensure ready is true after first render
    if (!ready) setReady(true);
  }, [ready]);

  const startAutoScroll = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (isUserScrolling.current) return;
      offsetRef.current += itemStep;
      listRef.current?.scrollToOffset({
        offset: offsetRef.current,
        animated: true,
      });
    }, AUTO_SCROLL_INTERVAL_MS);
  }, [itemStep]);

  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (ready) startAutoScroll();
    return stopAutoScroll;
  }, [ready, startAutoScroll, stopAutoScroll]);

  // Silent seamless loop: snap back to middle third near either edge
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const sectionWidth = lessons.length * itemStep;
      offsetRef.current = x;

      if (sectionWidth > 0) {
        if (x < sectionWidth * 0.5) {
          const corrected = x + sectionWidth;
          offsetRef.current = corrected;
          listRef.current?.scrollToOffset({
            offset: corrected,
            animated: false,
          });
        } else if (x > sectionWidth * 2.5) {
          const corrected = x - sectionWidth;
          offsetRef.current = corrected;
          listRef.current?.scrollToOffset({
            offset: corrected,
            animated: false,
          });
        }
      }
    },
    [lessons.length, itemStep],
  );

  const onScrollBeginDrag = useCallback(() => {
    isUserScrolling.current = true;
    stopAutoScroll();
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
  }, [stopAutoScroll]);

  const onScrollEnd = useCallback(() => {
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      isUserScrolling.current = false;
      startAutoScroll();
    }, RESUME_DELAY_MS);
  }, [startAutoScroll]);

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || shuffledLessons.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeInUp.duration(540)}>
      <SectionHeader
        title="Trending Lessons"
        onSeeAll={() => router.push("/see-all?type=courses")}
      />
      <FlatList
        ref={listRef}
        horizontal
        data={data}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item._key}
        onLayout={onLayout}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={onScrollBeginDrag}
        onScrollEndDrag={onScrollEnd}
        onMomentumScrollEnd={onScrollEnd}
        renderItem={({ item }) => {
          const displayTitle =
            item.title.length > 22
              ? `${item.title.slice(0, 22)}...`
              : item.title;

          return (
            <View
              style={[styles.card, { width: cardWidth }]}
              {...(Platform.OS !== "web"
                ? {
                    accessibilityRole: "button",
                    accessibilityLabel: `Open lesson: ${item.title}`,
                  }
                : {})}
              onStartShouldSetResponder={() => true}
              onResponderRelease={() =>
                router.push({
                  pathname: "/lesson-player",
                  params: {
                    title: item.title,
                    teacher: item.teacher,
                    subject: item.subject,
                    duration: item.duration,
                    link: item.link,
                    thumbnail: item.thumbnail,
                  },
                })
              }
            >
              <View style={styles.imageWrap}>
                <Pressable
                  style={styles.imagePressable}
                  accessibilityRole="button"
                  accessibilityLabel={`Open teacher profile: ${item.teacher}`}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    router.push({
                      pathname: "/teacher-profile",
                      params: { name: item.teacher },
                    } as never);
                  }}
                >
                  <CourseCardImage
                    thumbnail={item.thumbnail}
                    link={item.link}
                  />
                </Pressable>
                <View style={styles.overlay} />
                <View style={styles.playButton}>
                  <Text style={styles.playText}>
                    <Ionicons name="play" size={20} color="#fff" />
                  </Text>
                </View>
                {!!item.duration && (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{item.duration}</Text>
                  </View>
                )}
              </View>
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                  {displayTitle}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open teacher profile: ${item.teacher}`}
                  onPress={(event) => {
                    event.stopPropagation?.();
                    router.push({
                      pathname: "/teacher-profile",
                      params: { name: item.teacher },
                    } as never);
                  }}
                >
                  <Text style={styles.teacher} numberOfLines={1}>
                    {item.teacher}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  loaderWrap: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    color: colors.subtitle,
    fontSize: 13,
    textAlign: "center",
  },
  list: {
    paddingVertical: spacing.sm,
  },
  card: {
    marginRight: CARD_GAP,
    backgroundColor: colors.white,
  },
  imageWrap: {
    height: 132,
    position: "relative",
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  imagePressable: { width: "100%", height: "100%" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { backgroundColor: "#E2E8F0" },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.2)" },
  playButton: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    width: 35,
    height: 35,
    borderRadius: 100,
    backgroundColor: "rgb(255, 0, 0)",
    justifyContent: "center",
    alignItems: "center",
  },
  playText: { color: colors.dark, fontSize: 14, marginLeft: 2 },
  durationBadge: {
    position: "absolute",
    right: spacing.md,
    bottom: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  durationText: { color: colors.white, fontSize: 11, fontWeight: "500" },
  body: { padding: spacing.sm },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  teacher: { color: colors.subtitle, fontSize: 12, marginBottom: spacing.md },
  buttonWrap: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.green,
  },
  openText: { color: colors.white, fontSize: 15, fontWeight: "500" },
});
