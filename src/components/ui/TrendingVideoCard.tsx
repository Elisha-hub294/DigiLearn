import { colors, radius } from "@/constants/theme";
import {
  formatVideoUploadedAt,
  resolveVideoImageSource,
  validateVideoLink,
} from "@/utils/videoUtils";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { auth } from "../../../firebaseConfig";
import { recordUserActivity } from "../../services/activityService";
import { ActionDialog } from "./ActionDialog";
import { DurationBadge } from "./DurationBadge";
import { ResourceDeleteMenu } from "./ResourceDeleteMenu";

export type VideoLesson = {
  id: string;
  title: string;
  subject: string;
  teacher: string;
  uploadedAt: unknown;
  duration: string;
  thumbnail?: number | string;
  avatar?: number | string;
  link?: string;
  description?: string;
  owner?: string;
  isNew?: boolean;
  visits?: number;
};

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function TrendingVideoCard({
  item: rawItem,
  width,
  marginRight = 14,
}: {
  item: VideoLesson;
  width: number;
  marginRight?: number;
}) {
  const router = useRouter();
  const scale = useSharedValue(1);
  const [checkingVideo, setCheckingVideo] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const item = {
    ...rawItem,
    uploadedAt: formatVideoUploadedAt(rawItem.uploadedAt),
  };
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  async function openLesson() {
    if (checkingVideo) {
      return;
    }

    setCheckingVideo(true);
    const linkCheck = await validateVideoLink(item.link);
    setCheckingVideo(false);

    if (!linkCheck.valid) {
      setNotice(linkCheck.message);
      return;
    }

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
    <>
      <AnimatedPressable
        entering={FadeIn.duration(450)}
        accessibilityLabel={`Watch trending video: ${item.title}`}
        accessibilityRole="button"
        onPressIn={() => {
          scale.set(withSpring(0.97, { damping: 15, stiffness: 300 }));
        }}
        onPressOut={() => {
          scale.set(withSpring(1, { damping: 15, stiffness: 300 }));
        }}
        onPress={openLesson}
        style={[styles.card, { width, marginRight }, animatedStyle]}
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
                size={25}
                color={"white"}
                style={styles.playIconGlyph}
              />
            </View>
          </View>
          <View style={styles.duration}>
            <DurationBadge duration={item.duration} />
          </View>
          <View style={styles.menu}>
            <ResourceDeleteMenu
              collection="trendingLessons"
              id={item.id}
              title={item.title}
              data={{ owner: rawItem.owner, thumbnail: item.thumbnail }}
              light
            />
          </View>
        </View>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.title, styles.truncateText]}
        >
          {item.title}
        </Text>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.meta, styles.truncateText]}
        >
          {item.teacher} • {item.uploadedAt}
        </Text>
      </AnimatedPressable>
      <ActionDialog
        visible={Boolean(notice)}
        title="Video unavailable"
        message={notice ?? "This video cannot be opened right now."}
        primaryText="OK"
        onPrimary={() => setNotice(null)}
        onClose={() => setNotice(null)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { marginRight: 14 },
  thumbnail: {
    width: "100%", // Explicit width so aspectRatio calculates correctly
    aspectRatio: 1.5,
    backgroundColor: "#ddd",
    borderRadius: radius.sm,
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
    backgroundColor: colors.primary,
    borderRadius: 32,
    elevation: 5,
    height: 50,
    width: 50,
    justifyContent: "center",
  },
  playIconGlyph: { marginLeft: 3 },
  duration: { bottom: 10, position: "absolute", right: 10 },
  menu: { position: "absolute", top: 6, right: 6 },
  truncateText: {
    width: "100%",
  },
  title: {
    color: "#111",
    fontSize: 17,
    fontWeight: "500",
    lineHeight: 22,
    marginTop: 5,
    textTransform: "capitalize",
  },
  meta: { color: "#6E6E73", fontSize: 13, marginTop: 5 },
});
