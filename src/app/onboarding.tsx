import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import LottieView from "lottie-react-native";
import { useCallback, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHorizontalPadding } from "../constants/layout";

// ─── Constants ─────────────────────────────────────────────────────────────────

const ONBOARDING_KEY = "onboarding_complete";
const VIEWABILITY_CONFIG = { viewAreaCoveragePercentThreshold: 50 };

// ─── Slide Data ────────────────────────────────────────────────────────────────

const SLIDES = [
  {
    id: "slide1",
    headline: "Learn Without\nLimits",
    subtitle:
      "Access thousands of lessons, books and past papers — all in one place.",

    animation: require("../../assets/animations/onboarding1.json"),
    accentColor: "#4F8EF7",
  },
  {
    id: "slide2",
    headline: "Study Smarter\nwith AI",
    subtitle:
      "Our AI assistant answers questions, summarises notes and helps you master any topic.",

    animation: require("../../assets/animations/onboarding2.json"),
    accentColor: "#A78BFA",
  },
  {
    id: "slide3",
    headline: "Achieve Your\nGoals",
    subtitle:
      "Track your progress, earn achievements and become the best version of yourself.",

    animation: require("../../assets/animations/onboarding3.json"),
    accentColor: "#34D399",
  },
] as const;

// ─── Dot Indicator ─────────────────────────────────────────────────────────────

function DotIndicator({
  count,
  currentIndex,
  accentColor,
}: {
  count: number;
  currentIndex: number;
  accentColor: string;
}) {
  return (
    <View style={styles.dotsContainer}>
      {Array.from({ length: count }).map((_, i) => {
        const isActive = i === currentIndex;
        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              isActive
                ? [styles.dotActive, { backgroundColor: accentColor }]
                : styles.dotInactive,
            ]}
          />
        );
      })}
    </View>
  );
}

// ─── Slide Item ────────────────────────────────────────────────────────────────

type Slide = (typeof SLIDES)[number];

function SlideItem({ item, width }: { item: Slide; width: number }) {
  return (
    <View style={[styles.slide, { width }]}>
      <View
        style={[
          styles.animationWrapper,
          {
            width: Math.min(280, width - 64),
            height: Math.min(280, width - 64),
          },
        ]}
      >
        <LottieView
          source={item.animation}
          autoPlay
          loop
          style={styles.animation}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function OnboardingScreen() {
  const router = useRouter();
  const flatListRef = useRef<FlatList<Slide>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);

  const currentSlide = SLIDES[currentIndex];
  const isLast = currentIndex === SLIDES.length - 1;

  // ── Finish onboarding ──────────────────────────────────────────────────────
  const finish = useCallback(async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    router.replace("/welcome");
  }, [router]);

  // ── Next slide ─────────────────────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (isLast) {
      void finish();
    } else {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [isLast, currentIndex, finish]);

  // ── Viewable items tracking ────────────────────────────────────────────────
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    [],
  );

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />

      {/* Gradient background layers */}
      <View style={styles.bgBase} />
      <View
        style={[
          styles.bgGlow,
          { backgroundColor: currentSlide.accentColor + "22" },
        ]}
      />

      <SafeAreaView style={styles.safe} edges={["top", "bottom"]}>
        {/* Skip button */}
        <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
          <Pressable
            onPress={() => void finish()}
            style={({ pressed }) => [
              styles.skipBtn,
              pressed && styles.skipBtnPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Skip onboarding"
          >
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        </View>

        {/* Slides */}
        <FlatList
          ref={flatListRef}
          data={SLIDES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SlideItem item={item} width={width} />}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={VIEWABILITY_CONFIG}
          scrollEventThrottle={16}
          bounces={false}
          style={styles.flatList}
        />

        {/* Bottom section */}
        <View style={[styles.bottom, { paddingHorizontal: horizontalPadding }]}>
          {/* Text */}
          <View style={styles.textBlock}>
            <Text style={[styles.headline, { color: "#FFFFFF" }]}>
              {currentSlide.headline}
            </Text>
            <Text style={styles.subtitle}>{currentSlide.subtitle}</Text>
          </View>

          {/* Dots */}
          <DotIndicator
            count={SLIDES.length}
            currentIndex={currentIndex}
            accentColor={currentSlide.accentColor}
          />

          {/* CTA Button */}
          <Pressable
            onPress={handleNext}
            style={({ pressed }) => [
              styles.ctaButton,
              { backgroundColor: currentSlide.accentColor },
              pressed && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isLast ? "Get started with OS platform" : "Next slide"
            }
          >
            <Text style={styles.ctaText}>
              {isLast ? "Get Started" : "Next"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#05091A",
  },
  bgBase: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#05091A",
  },
  bgGlow: {
    position: "absolute",
    top: "15%",
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 999,
    transform: [{ scaleX: 2.5 }],
    opacity: 0.6,
  },
  safe: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 8,
    alignItems: "flex-end",
  },
  skipBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  skipBtnPressed: {
    opacity: 0.6,
  },
  skipText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "500",
  },
  flatList: {
    flex: 1,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  animationWrapper: {
    width: 280,
    height: 280,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.3)",
      },
      android: {
        elevation: 8,
      },
    }),
  },
  animation: {
    width: 260,
    height: 260,
  },
  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 24,
    gap: 24,
  },
  textBlock: {
    gap: 10,
  },
  headline: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: -0.5,
    lineHeight: 40,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "400",
  },
  dotsContainer: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 28,
  },
  dotInactive: {
    width: 8,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  ctaButton: {
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.25)",
      },
      android: {
        elevation: 6,
      },
    }),
  },
  ctaPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  ctaText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
