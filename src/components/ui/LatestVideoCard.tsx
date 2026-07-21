import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { DurationBadge } from "./DurationBadge";
import { PlayButton } from "./PlayButton";
import { TeacherInfo } from "./TeacherInfo";
import { VideoLesson } from "./TrendingVideoCard";
import { videoRadii } from "./videoDesign";
function resolveImageSource(source?: number | string) {
  if (!source) {
    return require("../../../assets/images/thumb-1.jpeg");
  }
  if (typeof source === "string") {
    return { uri: source };
  }
  return source;
}
export function LatestVideoCard({
  item,
  index,
  isGrid = false,
}: {
  item: VideoLesson;
  index: number;
  isGrid?: boolean;
}) {
  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index * 60, 300)).duration(380)}
      style={[styles.card, isGrid && styles.gridCard]}
    >
      <View style={styles.thumbnail}>
        <Image
          source={resolveImageSource(item.thumbnail)}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
        />
        <View style={styles.overlay} />
        <View style={styles.play}>
          <PlayButton label={`Play ${item.title}`} />
        </View>
        <View style={styles.duration}>
          <DurationBadge duration={item.duration} />
        </View>
        {item.isNew && (
          <View style={styles.new}>
            <Text style={styles.newText}>NEW</Text>
          </View>
        )}
      </View>
      <TeacherInfo
        name={item.teacher}
        uploadedAt={item.uploadedAt}
        avatar={item.avatar}
      />
      <Text numberOfLines={2} style={styles.title}>
        {item.title}
      </Text>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  card: { marginBottom: 48 },
  gridCard: { marginHorizontal: 8 },
  thumbnail: {
    backgroundColor: "#ddd",
    borderRadius: videoRadii.thumbnail,
    height: 210,
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
  duration: { bottom: 10, position: "absolute", right: 10 },
  new: {
    backgroundColor: "#FF3B30",
    borderRadius: 6,
    left: 10,
    paddingHorizontal: 7,
    paddingVertical: 4,
    position: "absolute",
    top: 10,
  },
  newText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: "#111",
    fontSize: 18,
    fontWeight: "600",
    lineHeight: 24,
    marginTop: 12,
  },
});
