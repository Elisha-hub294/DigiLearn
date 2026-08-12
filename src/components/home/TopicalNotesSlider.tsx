import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
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

const SUPABASE_ICONS =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons";

const items = [
  { id: "math", title: "Mathematics", image: `${SUPABASE_ICONS}/math-3d.png` },
  { id: "physics", title: "Physics", image: `${SUPABASE_ICONS}/phys-3d.png` },
  {
    id: "chemistry",
    title: "Chemistry",
    image: `${SUPABASE_ICONS}/chem-3d.png`,
  },
  {
    id: "agriculture",
    title: "Agriculture",
    image: `${SUPABASE_ICONS}/agric-3d.png`,
  },
  { id: "biology", title: "Biology", image: `${SUPABASE_ICONS}/bio-3d.png` },
  {
    id: "english",
    title: "English",
    image: `${SUPABASE_ICONS}/eng-3d.png`,
  },
  {
    id: "history",
    title: "History",
    image: `${SUPABASE_ICONS}/hist-3d.png`,
  },
  {
    id: "geography",
    title: "Geography",
    image: `${SUPABASE_ICONS}/geo-3d.png`,
  },
  {
    id: "cre",
    title: "CRE",
    image: `${SUPABASE_ICONS}/cre-3d.png`,
  },
  {
    id: "kiswahili",
    title: "Kiswahili",
    image: `${SUPABASE_ICONS}/kis-3d.png`,
  },
  {
    id: "entrepreneurship",
    title: "Entrepreneurship",
    image: `${SUPABASE_ICONS}/ent-3d.png`,
  },
  {
    id: "ire",
    title: "IRE",
    image: `${SUPABASE_ICONS}/ire-3d.png`,
  },
  {
    id: "art-design",
    title: "Art & Design",
    image: `${SUPABASE_ICONS}/art-3d.png`,
  },
  {
    id: "ict",
    title: "ICT",
    image: `${SUPABASE_ICONS}/ict-3d.png`,
  },
  {
    id: "literature",
    title: "Literature",
    image: `${SUPABASE_ICONS}/lit-3d.png`,
  },
  {
    id: "luganda",
    title: "Luganda",
    image: `${SUPABASE_ICONS}/lug-3d.png`,
  },

  {
    id: "french",
    title: "French",
    image: `${SUPABASE_ICONS}/fr-3d.png`,
  },
];

/** Fisher-Yates shuffle runs once per app mount */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const AUTO_SCROLL_INTERVAL_MS = 2500;
const RESUME_DELAY_MS = 3000;
const CARD_GAP = spacing.lg; // marginRight on each card

export const TopicalNotesSlider = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = width >= 900 ? 128 : 110;
  const itemStep = cardWidth + CARD_GAP;

  // Triple the shuffled list for an infinite-loop illusion
  const shuffled = items; // keep original order
  const data = useMemo(
    () => [
      ...shuffled.map((i) => ({ ...i, _key: `a-${i.id}` })),
      ...shuffled.map((i) => ({ ...i, _key: `b-${i.id}` })),
      ...shuffled.map((i) => ({ ...i, _key: `c-${i.id}` })),
    ],
    [shuffled],
  );

  const listRef = useRef<FlatList>(null);
  const offsetRef = useRef(shuffled.length * itemStep); // start in middle third
  const isUserScrolling = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);

  // Jump to middle section on first layout so loop can go either direction
  const onLayout = useCallback(() => {
    if (!ready) {
      listRef.current?.scrollToOffset({
        offset: offsetRef.current,
        animated: false,
      });
      setReady(true);
    }
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

  // Seamlessly loop: when nearing either edge, silently snap to the mirror
  // position inside the middle third � user never sees the jump.
  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      const sectionWidth = shuffled.length * itemStep;
      offsetRef.current = x;

      if (x < sectionWidth * 0.5) {
        const corrected = x + sectionWidth;
        offsetRef.current = corrected;
        listRef.current?.scrollToOffset({ offset: corrected, animated: false });
      } else if (x > sectionWidth * 2.5) {
        const corrected = x - sectionWidth;
        offsetRef.current = corrected;
        listRef.current?.scrollToOffset({ offset: corrected, animated: false });
      }
    },
    [shuffled.length, itemStep],
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

  const scrollByStep = useCallback(
    (direction: 1 | -1) => {
      // Pause auto-scroll and resume after delay (same as user drag)
      stopAutoScroll();
      isUserScrolling.current = true;
      offsetRef.current += direction * itemStep;
      listRef.current?.scrollToOffset({
        offset: offsetRef.current,
        animated: true,
      });
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        isUserScrolling.current = false;
        startAutoScroll();
      }, RESUME_DELAY_MS);
    },
    [itemStep, stopAutoScroll, startAutoScroll],
  );

  const isWeb = Platform.OS === "web";

  return (
    <Animated.View entering={FadeInUp.duration(460)} style={styles.wrapper}>
      {/* Left arrow — web only */}
      {isWeb && (
        <Pressable
          style={[styles.arrow, styles.arrowLeft]}
          onPress={() => scrollByStep(-1)}
          accessibilityRole="button"
          accessibilityLabel="Scroll left"
        >
          <Text style={styles.arrowText}>&#8249;</Text>
        </Pressable>
      )}

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
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            accessibilityRole="button"
            accessibilityLabel={item.title}
            onPress={() =>
              router.push({
                pathname: "/pages",
                params: { title: item.title },
              } as any)
            }
          >
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: item.image }}
                style={styles.image}
                contentFit="contain"
              />
            </View>
            <Text style={styles.title}>{item.title}</Text>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
      />

      {/* Right arrow — web only */}
      {isWeb && (
        <Pressable
          style={[styles.arrow, styles.arrowRight]}
          onPress={() => scrollByStep(1)}
          accessibilityRole="button"
          accessibilityLabel="Scroll right"
        >
          <Text style={styles.arrowText}>&#8250;</Text>
        </Pressable>
      )}
    </Animated.View>
  );
};

const ARROW_SIZE = 34;

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  list: {
    flexGrow: 1,
    flexShrink: 1,
  },
  card: {
    marginRight: CARD_GAP,
    alignItems: "center",
  },
  imageWrap: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  image: { width: 80, height: 80, borderRadius: radius.sm },
  title: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "500",
  },
  arrow: {
    width: ARROW_SIZE,
    height: ARROW_SIZE,
    borderRadius: ARROW_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    flexShrink: 0,
    shadowColor: "#0F172A",
    shadowOpacity: 0.5,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  arrowLeft: {
    marginRight: spacing.sm,
  },
  arrowRight: {
    marginLeft: spacing.sm,
  },
  arrowText: {
    fontSize: 22,
    lineHeight: 24,
    color: colors.white,
    fontWeight: "700",
    marginTop: -5,
    userSelect: "none",
  } as any,
});
