import { resolveVideoImageSource } from "@/utils/videoUtils";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { auth } from "../../../firebaseConfig";
import { recordUserActivity } from "../../services/activityService";
import { DurationBadge } from "./DurationBadge";
import { TeacherInfo } from "./TeacherInfo";
import { videoColors, videoRadii, videoShadows } from "./videoDesign";

export type VideoLesson = {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  uploadedAt: string;
  duration: string;
  thumbnail?: number | string;
  avatar?: number | string;
  link?: string;
  isNew?: boolean;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TrendingVideoCard({
  item,
  width,
}: {
  item: VideoLesson;
  width: number;
}) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function openLesson() {
    if (auth.currentUser?.uid) {
      recordUserActivity(auth.currentUser.uid, "lesson", item.id);
    }
    router.push({
      pathname: "/lesson-player",
      params: {
        id: item.id,
        title: item.title,
        teacher: item.teacher,
        subject: item.subject,
        duration: item.duration,
        uploadedAt: item.uploadedAt,
        link: item.link ?? "",
        thumbnail: typeof item.thumbnail === "string" ? item.thumbnail : "",
        avatar: typeof item.avatar === "string" ? item.avatar : "",
      },
    });
  }

  return (
    <AnimatedPressable
      entering={FadeIn.duration(450)}
      accessibilityLabel={`Watch trending video: ${item.title}`}
      accessibilityRole="button"
      onPressIn={() => {
        scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      }}
      onPress={openLesson}
      style={[styles.card, { width }, animatedStyle]}
    >
      <View style={styles.thumbnail}>
        <Image
          source={resolveVideoImageSource(item.thumbnail, item.link)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
        />
        <View pointerEvents="none" style={styles.overlay} />
        <View pointerEvents="none" style={styles.play}>
          <View style={styles.playIcon}>
            <Ionicons
              name="play"
              size={34}
              color="#111"
              style={styles.playIconGlyph}
            />
          </View>
        </View>
        <View style={styles.duration}>
          <DurationBadge duration={item.duration} />
        </View>
      </View>
      <Text numberOfLines={2} style={styles.title}>
        {item.title}
      </Text>
      <Text style={styles.meta}>
        {item.teacher} • {item.uploadedAt}
      </Text>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: 14 },
  thumbnail: {
    ...videoShadows.soft,
    width: "100%", // Explicit width so aspectRatio calculates correctly
    aspectRatio: 1.55,
    backgroundColor: "#ddd",
    borderRadius: videoRadii.card,
    overflow: "hidden",
  },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.25)" },
  play: {
    alignItems: "center",
    bottom: 0,
    justifyContent: "center",
    left: 0,
    position: "absolute",
    right: 0,
    top: 0,
  },
  playIcon: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.92)",
    borderRadius: 32,
    elevation: 5,
    height: 64,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 9,
    width: 64,
  },
  playIconGlyph: { marginLeft: 3 },
  duration: { bottom: 10, position: "absolute", right: 10 },
  title: {
    color: "#111",
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 22,
    marginTop: 12,
  },
  meta: { color: "#6E6E73", fontSize: 13, marginTop: 5 },
});
