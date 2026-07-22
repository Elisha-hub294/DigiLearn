import { Image } from "expo-image";
import {
  ActivityIndicator,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, radius, spacing } from "../../constants/theme";
import { useTrendingLessons } from "../../hooks/useTrendingLessons";

const AUTO_SCROLL_INTERVAL_MS = 4500;
const RESUME_DELAY_MS = 5000;
const CARD_GAP = spacing.md; // matches marginRight on each card

export const CoursesCarousel = () => {
  const { width } = useWindowDimensions();
  const { lessons, loading, error } = useTrendingLessons();
  const cardWidth = width >= 900 ? 240 : 220;
  const itemStep = cardWidth + CARD_GAP;

  // Triple the lessons array for an infinite-loop illusion
  const data = useMemo(
    () => [
      ...lessons.map((l, i) => ({ ...l, _key: `a-${l.id}-${i}` })),
      ...lessons.map((l, i) => ({ ...l, _key: `b-${l.id}-${i}` })),
      ...lessons.map((l, i) => ({ ...l, _key: `c-${l.id}-${i}` })),
    ],
    [lessons]
  );

  const listRef = useRef<FlatList>(null);
  const offsetRef = useRef(0);
  const isUserScrolling = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);

  // On first layout jump into the middle third
  const onLayout = useCallback(() => {
    if (!ready && lessons.length > 0) {
      const midOffset = lessons.length * itemStep;
      offsetRef.current = midOffset;
      listRef.current?.scrollToOffset({ offset: midOffset, animated: false });
      setReady(true);
    }
  }, [ready, lessons.length, itemStep]);

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
          listRef.current?.scrollToOffset({ offset: corrected, animated: false });
        } else if (x > sectionWidth * 2.5) {
          const corrected = x - sectionWidth;
          offsetRef.current = corrected;
          listRef.current?.scrollToOffset({ offset: corrected, animated: false });
        }
      }
    },
    [lessons.length, itemStep]
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

  if (error || lessons.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>
          {error ?? "No courses available yet."}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(540)}>
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
            <Pressable
              style={[styles.card, { width: cardWidth }]}
              accessibilityRole="button"
            >
              <View style={styles.imageWrap}>
                {item.thumbnail ? (
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.image}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]} />
                )}
                <View style={styles.overlay} />
                <View style={styles.playButton}>
                  <Text style={styles.playText}>?</Text>
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
                <Text style={styles.teacher} numberOfLines={1}>
                  {item.teacher}
                </Text>
                <View style={styles.buttonWrap}>
                  <Text style={styles.openText}>Watch</Text>
                </View>
              </View>
            </Pressable>
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
    borderRadius: radius.sm,
    overflow: "hidden",
    borderBottomColor: colors.border,
    borderBottomWidth: 0.5,
  },
  imageWrap: { height: 132, position: "relative" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { backgroundColor: "#E2E8F0" },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.2)" },
  playButton: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  playText: { color: colors.dark, fontSize: 14, marginLeft: 2 },
  durationBadge: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
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
