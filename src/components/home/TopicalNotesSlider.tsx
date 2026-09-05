import { FirebaseImage as Image } from "@/components/ui/FirebaseImage";
import { Feather as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
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
import Animated, { FadeInUp, useReducedMotion } from "react-native-reanimated";
import { db } from "../../../firebaseConfig";
import { colors, radius, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";
import { getFirebaseStorageUrl } from "../../utils/firebaseStorage";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../../utils/interestFilter";

const defaultSubjectAvatar = require("../../../assets/images/subject-default.png");

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
const MIN_LOOP_COPIES = 5;

export function normalizeCarouselOffset(
  offset: number,
  sectionWidth: number,
  middleStart: number,
) {
  if (sectionWidth === 0) return 0;
  let normalized = offset;
  while (normalized < middleStart) normalized += sectionWidth;
  while (normalized >= middleStart + sectionWidth) normalized -= sectionWidth;
  return normalized;
}

export const TopicalNotesSlider = () => {
  const router = useRouter();
  const { colors: themeColors } = useTheme();
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const reducedMotion = useReducedMotion();
  const cardWidth = width >= 900 ? 128 : 110;
  const itemStep = cardWidth + CARD_GAP;
  const [subjects, setSubjects] = useState<
    { id: string; title: string; image: string | any }[]
  >([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Prepare display list: while loading show placeholders with default avatar
  const placeholderCount = 10;
  const placeholderItems = useMemo(
    () =>
      Array.from({ length: placeholderCount }).map((_, idx) => ({
        id: `placeholder-${idx}`,
        title: "",
        image: defaultSubjectAvatar,
      })),
    [],
  );

  const filteredSubjects = useMemo(() => {
    if (!shouldFilterByInterests(profile)) return subjects;
    return subjects.filter((item) =>
      matchesUserInterests(item.title, profile?.subjects),
    );
  }, [subjects, profile]);

  const shuffled = loadingSubjects ? placeholderItems : filteredSubjects;
  const loopCopies = Math.max(MIN_LOOP_COPIES, Math.ceil(width / itemStep) + 5);
  const middleSection = Math.floor(loopCopies / 2);
  const data = useMemo(
    () =>
      Array.from({ length: loopCopies }, (_, copy) =>
        shuffled.map((i) => ({ ...i, _key: `${copy}-${i.id}` })),
      ).flat(),
    [loopCopies, shuffled],
  );

  const listRef = useRef<FlatList>(null);
  const offsetRef = useRef(middleSection * shuffled.length * itemStep);
  const isUserScrolling = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [ready, setReady] = useState(false);

  const sectionWidth = shuffled.length * itemStep;
  const middleStart = middleSection * sectionWidth;

  const normalizeOffset = useCallback(
    (offset: number) =>
      normalizeCarouselOffset(offset, sectionWidth, middleStart),
    [middleStart, sectionWidth],
  );

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
      offsetRef.current = normalizeOffset(offsetRef.current + itemStep);
      listRef.current?.scrollToOffset({
        offset: offsetRef.current,
        animated: !reducedMotion,
      });
    }, AUTO_SCROLL_INTERVAL_MS);
  }, [itemStep, normalizeOffset, reducedMotion]);

  const stopAutoScroll = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    stopAutoScroll();
    if (resumeTimerRef.current) {
      clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    isUserScrolling.current = false;
    offsetRef.current = middleStart;
    listRef.current?.scrollToOffset({ offset: middleStart, animated: false });
  }, [middleStart, stopAutoScroll]);

  useEffect(() => {
    if (ready && !reducedMotion) startAutoScroll();
    return stopAutoScroll;
  }, [ready, reducedMotion, startAutoScroll, stopAutoScroll]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      stopAutoScroll();
    },
    [stopAutoScroll],
  );

  const resumeAfterHover = useCallback(() => {
    if (ready && !reducedMotion && !isUserScrolling.current) {
      startAutoScroll();
    }
  }, [ready, reducedMotion, startAutoScroll]);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const x = e.nativeEvent.contentOffset.x;
      offsetRef.current = x;

      if (x < middleStart || x >= middleStart + sectionWidth) {
        const corrected = normalizeOffset(x);
        offsetRef.current = corrected;
        listRef.current?.scrollToOffset({ offset: corrected, animated: false });
      }
    },
    [middleStart, normalizeOffset, sectionWidth],
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
      offsetRef.current = normalizeOffset(
        offsetRef.current + direction * itemStep,
      );
      listRef.current?.scrollToOffset({
        offset: offsetRef.current,
        animated: !reducedMotion,
      });
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = setTimeout(() => {
        isUserScrolling.current = false;
        startAutoScroll();
      }, RESUME_DELAY_MS);
    },
    [itemStep, normalizeOffset, reducedMotion, stopAutoScroll, startAutoScroll],
  );

  const isWeb = Platform.OS === "web";

  const normalizeKey = (s?: string) => (s ?? "").trim().toLowerCase();

  useEffect(() => {
    let active = true;
    const loadSubjects = async () => {
      try {
        const snaps = await getDocs(collection(db, "subject"));
        if (!active) return;

        const list = await Promise.all(
          snaps.docs.map(async (d) => {
            const data = d.data() as Record<string, unknown>;
            const name = typeof data.name === "string" ? data.name.trim() : "";
            const avatar =
              typeof data.avatar === "string" ? data.avatar.trim() : "";
            const resolvedAvatar = avatar
              ? await getFirebaseStorageUrl(avatar)
              : "";

            return {
              id: normalizeKey(name) || d.id,
              title: name || d.id,
              image: resolvedAvatar || defaultSubjectAvatar,
            };
          }),
        );

        if (active) setSubjects(shuffle(list));
      } catch (e) {
        console.error("Failed to load subjects:", e);
        if (active) setSubjects([]);
      } finally {
        if (active) setLoadingSubjects(false);
      }
    };
    loadSubjects();
    return () => {
      active = false;
    };
  }, []);

  if (!loadingSubjects && shuffled.length === 0) return null;

  return (
    <Animated.View
      {...({
        onMouseEnter: stopAutoScroll,
        onMouseLeave: resumeAfterHover,
      } as any)}
      entering={reducedMotion ? undefined : FadeInUp.duration(460)}
      style={styles.wrapper}
    >
      {/* Left arrow — web only */}
      {isWeb && (
        <Pressable
          style={[styles.arrow, styles.arrowLeft]}
          onPress={() => scrollByStep(-1)}
          onHoverIn={stopAutoScroll}
          onHoverOut={resumeAfterHover}
          accessibilityRole="button"
          accessibilityLabel="Scroll left"
        >
          <Icon name="chevron-left" size={22} color={colors.white} />
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
              {(() => {
                const imageSource =
                  typeof item.image === "string"
                    ? { uri: item.image }
                    : item.image;
                return (
                  <Image
                    source={imageSource}
                    style={styles.image}
                    contentFit="contain"
                  />
                );
              })()}
            </View>
            <Text style={[styles.title, { color: themeColors.dark }]}>
              {item.title}
            </Text>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
      />

      {/* Right arrow — web only */}
      {isWeb && (
        <Pressable
          style={[styles.arrow, styles.arrowRight]}
          onPress={() => scrollByStep(1)}
          onHoverIn={stopAutoScroll}
          onHoverOut={resumeAfterHover}
          accessibilityRole="button"
          accessibilityLabel="Scroll right"
        >
          <Icon name="chevron-right" size={22} color={colors.white} />
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
  list: {},
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
});
