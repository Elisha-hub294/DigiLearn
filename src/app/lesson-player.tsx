import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import { useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { dimensions } from "../constants/theme";

function getYoutubeEmbedUrl(rawUrl?: string) {
  if (!rawUrl) {
    return "https://www.youtube.com/embed/dQw4w9WgXcQ";
  }

  const trimmed = rawUrl.trim();
  const watchMatch = trimmed.match(/[?&]v=([^&#]+)/);
  const shortMatch = trimmed.match(/youtu\.be\/([^?#]+)/);
  const id = watchMatch?.[1] ?? shortMatch?.[1];

  if (!id) {
    return trimmed;
  }

  return `https://www.youtube.com/embed/${id}`;
}

function resolveImageSource(source?: string) {
  if (!source) {
    return require("../../assets/images/thumb-1.jpeg");
  }
  if (
    typeof source === "string" &&
    (source.startsWith("http") || source.startsWith("data:"))
  ) {
    return { uri: source };
  }
  return require("../../assets/images/thumb-1.jpeg");
}

function resolveAvatarSource(source?: string) {
  if (!source) {
    return require("../../assets/images/user.png");
  }
  if (
    typeof source === "string" &&
    (source.startsWith("http") || source.startsWith("data:"))
  ) {
    return { uri: source };
  }
  return require("../../assets/images/user.png");
}

export default function LessonPlayerScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [isSaved, setIsSaved] = useState(false);

  const params = useLocalSearchParams<{
    title?: string;
    teacher?: string;
    subject?: string;
    duration?: string;
    uploadedAt?: string;
    link?: string;
    thumbnail?: string;
    avatar?: string;
  }>();

  const playScale = useSharedValue(1);
  const playAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: playScale.value }],
  }));

  const embedUrl = useMemo(
    () => getYoutubeEmbedUrl(params.link),
    [params.link],
  );

  async function openVideo() {
    if (!embedUrl) {
      return;
    }
    await WebBrowser.openBrowserAsync(embedUrl, {
      presentationStyle: "fullScreen",
      controlsColor: "#3B82F6",
    });
  }

  async function handleShare() {
    try {
      await Share.share({
        title: params.title ?? "Lesson Preview",
        message: `Check out this lesson: "${params.title ?? "Lesson"}" by ${
          params.teacher ?? "Teacher"
        } on DigiLearn!`,
        url: params.link ?? embedUrl,
      });
    } catch {
      // Ignored
    }
  }

  function toggleSave() {
    setIsSaved((prev) => {
      const next = !prev;
      Alert.alert(
        next ? "Saved to Library" : "Removed from Saved",
        next
          ? "This lesson is now saved in your bookmarks."
          : "Lesson removed from saved items.",
      );
      return next;
    });
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/videos");
    }
  }

  const horizontalPadding = dimensions.screenPaddingHorizontal;
  const maxContentWidth = Math.min(width, dimensions.maxContentWidth);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Navigation Header */}
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Back to videos"
          accessibilityRole="button"
          onPress={handleBack}
          style={styles.iconButton}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color="#0F172A" />
        </Pressable>
        <Text style={styles.headerTitle}>Lesson Preview</Text>
        <View style={styles.headerRightActions}>
          <Pressable
            accessibilityLabel="Bookmark lesson"
            accessibilityRole="button"
            onPress={toggleSave}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isSaved ? "#3B82F6" : "#0F172A"}
            />
          </Pressable>
          <Pressable
            accessibilityLabel="Share lesson"
            accessibilityRole="button"
            onPress={handleShare}
            style={styles.iconButton}
            hitSlop={8}
          >
            <Ionicons name="share-outline" size={20} color="#0F172A" />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingHorizontal: horizontalPadding, maxWidth: maxContentWidth },
        ]}
      >
        {/* Hero Video Card */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.heroCardContainer}
        >
          <Pressable
            onPress={openVideo}
            onPressIn={() => {
              playScale.value = withSpring(0.95);
            }}
            onPressOut={() => {
              playScale.value = withSpring(1);
            }}
            style={styles.heroPressable}
            accessibilityLabel={`Play video: ${params.title ?? "Lesson"}`}
            accessibilityRole="button"
          >
            <Image
              source={resolveImageSource(params.thumbnail)}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={300}
            />
            <View style={styles.heroOverlay} />

            {/* Subject Pill Badge */}
            <View style={styles.subjectBadge}>
              <Text style={styles.subjectBadgeText}>
                {params.subject?.toUpperCase() ?? "GENERAL"}
              </Text>
            </View>

            {/* Play Button Icon Overlay */}
            <Animated.View
              style={[styles.playButtonWrapper, playAnimatedStyle]}
            >
              <View style={styles.playButtonInner}>
                <Ionicons
                  name="play"
                  size={32}
                  color="#3B82F6"
                  style={styles.playIconOffset}
                />
              </View>
            </Animated.View>

            {/* Duration Badge */}
            <View style={styles.durationBadge}>
              <Ionicons name="time-outline" size={13} color="#FFFFFF" />
              <Text style={styles.durationBadgeText}>
                {params.duration ?? "00:00"}
              </Text>
            </View>
          </Pressable>
        </Animated.View>

        {/* Primary Watch Action Button */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)}>
          <Pressable
            style={styles.primaryWatchBtn}
            onPress={openVideo}
            accessibilityLabel="Watch full lesson video"
            accessibilityRole="button"
          >
            <Ionicons name="play-circle" size={24} color="#FFFFFF" />
            <Text style={styles.primaryWatchBtnText}>Watch Full Lesson</Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
              style={styles.arrowIcon}
            />
          </Pressable>
        </Animated.View>

        {/* Lesson Details & Educator Section */}
        <Animated.View
          entering={FadeInDown.delay(150).duration(400)}
          style={styles.detailsCard}
        >
          <Text style={styles.title}>{params.title ?? "Untitled Lesson"}</Text>

          {/* Instructor Profile */}
          <View style={styles.instructorRow}>
            <Image
              source={resolveAvatarSource(params.avatar)}
              style={styles.avatarImage}
              contentFit="cover"
            />
            <View style={styles.instructorTextWrap}>
              <View style={styles.instructorNameRow}>
                <Text style={styles.instructorName}>
                  {params.teacher ?? "Educator"}
                </Text>
                <Ionicons name="checkmark-circle" size={16} color="#3B82F6" />
              </View>
              <Text style={styles.instructorRole}>Verified Educator</Text>
            </View>
          </View>

          {/* Specs / Quick Info Grid */}
          <View style={styles.specsRow}>
            <View style={styles.specCard}>
              <Ionicons name="time" size={18} color="#3B82F6" />
              <Text style={styles.specLabel}>Duration</Text>
              <Text style={styles.specValue}>{params.duration ?? "00:00"}</Text>
            </View>
            <View style={styles.specCard}>
              <Ionicons name="calendar" size={18} color="#10B981" />
              <Text style={styles.specLabel}>Added</Text>
              <Text style={styles.specValue} numberOfLines={1}>
                {params.uploadedAt ?? "Recent"}
              </Text>
            </View>
            <View style={styles.specCard}>
              <Ionicons name="sparkles" size={18} color="#F59E0B" />
              <Text style={styles.specLabel}>Access</Text>
              <Text style={styles.specValue}>Free HD</Text>
            </View>
          </View>
        </Animated.View>

        {/* Overview & Key Highlights Card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(400)}
          style={styles.overviewCard}
        >
          <Text style={styles.sectionHeaderTitle}>Lesson Overview</Text>
          <Text style={styles.descriptionText}>
            This video lesson provides comprehensive study material for{" "}
            <Text style={styles.boldText}>
              {params.subject ?? "this subject"}
            </Text>
            . Review concepts, follow step-by-step explanations, and boost your
            understanding with expert guidance.
          </Text>

          <View style={styles.divider} />

          <Text style={styles.sectionHeaderTitle}>What You'll Learn</Text>
          <View style={styles.takeawaysList}>
            <View style={styles.takeawayItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.takeawayText}>
                In-depth explanation of core topics & fundamentals
              </Text>
            </View>
            <View style={styles.takeawayItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.takeawayText}>
                Step-by-step problem solving & practical examples
              </Text>
            </View>
            <View style={styles.takeawayItem}>
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              <Text style={styles.takeawayText}>
                Essential revision summary and key exam insights
              </Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: "#FFFFFF",
    flex: 1,
  },
  header: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderBottomColor: "#F1F5F9",
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: "center",
    width: 40,
  },
  headerTitle: {
    color: "#0F172A",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  headerRightActions: {
    flexDirection: "row",
    gap: 8,
  },
  scrollContent: {
    alignSelf: "center",
    paddingBottom: 40,
    paddingTop: 16,
    width: "100%",
  },
  heroCardContainer: {
    aspectRatio: 1.6,
    backgroundColor: "#0F172A",
    borderRadius: 24,
    elevation: 4,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    width: "100%",
  },
  heroPressable: {
    flex: 1,
    position: "relative",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.35)",
  },
  subjectBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 8,
    left: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    position: "absolute",
    top: 14,
  },
  subjectBadgeText: {
    color: "#3B82F6",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  playButtonWrapper: {
    alignItems: "center",
    alignSelf: "center",
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: "35%",
  },
  playButtonInner: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    elevation: 6,
    height: 70,
    justifyContent: "center",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    width: 70,
  },
  playIconOffset: {
    marginLeft: 3,
  },
  durationBadge: {
    alignItems: "center",
    backgroundColor: "rgba(15, 23, 42, 0.82)",
    borderRadius: 6,
    bottom: 14,
    flexDirection: "row",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    position: "absolute",
    right: 14,
  },
  durationBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  primaryWatchBtn: {
    alignItems: "center",
    backgroundColor: "#3B82F6",
    borderRadius: 16,
    elevation: 4,
    flexDirection: "row",
    gap: 10,
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: "#3B82F6",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  primaryWatchBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  arrowIcon: {
    marginLeft: "auto",
  },
  detailsCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 18,
    padding: 18,
  },
  title: {
    color: "#0F172A",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  instructorRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  avatarImage: {
    borderColor: "#E2E8F0",
    borderRadius: 22,
    borderWidth: 1,
    height: 44,
    width: 44,
  },
  instructorTextWrap: {
    flex: 1,
  },
  instructorNameRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 6,
  },
  instructorName: {
    color: "#0F172A",
    fontSize: 15,
    fontWeight: "700",
  },
  instructorRole: {
    color: "#64748B",
    fontSize: 13,
    marginTop: 2,
  },
  specsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  specCard: {
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#F1F5F9",
    borderRadius: 14,
    borderWidth: 1,
    flex: 1,
    paddingHorizontal: 6,
    paddingVertical: 12,
  },
  specLabel: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 4,
  },
  specValue: {
    color: "#0F172A",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 2,
  },
  overviewCard: {
    backgroundColor: "#F8FAFC",
    borderColor: "#E2E8F0",
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 16,
    padding: 18,
  },
  sectionHeaderTitle: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "700",
  },
  descriptionText: {
    color: "#475569",
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  boldText: {
    color: "#0F172A",
    fontWeight: "700",
  },
  divider: {
    backgroundColor: "#E2E8F0",
    height: 1,
    marginVertical: 16,
  },
  takeawaysList: {
    gap: 10,
    marginTop: 12,
  },
  takeawayItem: {
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },
  takeawayText: {
    color: "#334155",
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
});
