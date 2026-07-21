import { Image } from "expo-image";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, radius, spacing } from "../../constants/theme";

const items = [
  {
    id: "c1",
    title: "Mastering Quadratics",
    teacher: "Tr. Sarah",
    duration: "18 min",
    image: require("../../../assets/images/thumb-1.jpeg"),
  },
  {
    id: "c2",
    title: "Physics in Practice",
    teacher: "Tr. Daniel",
    duration: "24 min",
    image: require("../../../assets/images/thumb-2.jpeg"),
  },
  {
    id: "c3",
    title: "Organic Chemistry Essentials",
    teacher: "Tr. Joy",
    duration: "12 min",
    image: require("../../../assets/images/thumb-4.jpeg"),
  },
];

export const CoursesCarousel = () => {
  const { width } = useWindowDimensions();
  const data = [...items, ...items, ...items];
  const cardWidth = width >= 900 ? 240 : 220;

  return (
    <Animated.View entering={FadeInUp.duration(540)}>
      <FlatList
        horizontal
        data={data}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => {
          const displayTitle =
            item.title.length > 20
              ? `${item.title.slice(0, 20)}...`
              : item.title;

          return (
            <Pressable
              style={[styles.card, { width: cardWidth }]}
              accessibilityRole="button"
            >
              <View style={styles.imageWrap}>
                <Image
                  source={item.image}
                  style={styles.image}
                  contentFit="cover"
                />
                <View style={styles.overlay} />
                <View style={styles.playButton}>
                  <Text style={styles.playText}>▶</Text>
                </View>
                <View style={styles.durationBadge}>
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>
              </View>
              <View style={styles.body}>
                <Text style={styles.title}>{displayTitle}</Text>
                <Text style={styles.teacher}>{item.teacher}</Text>
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
  list: {
    paddingVertical: spacing.sm,
  },
  card: {
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  imageWrap: { height: 132, position: "relative" },
  image: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.2)" },
  playButton: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    width: 35,
    height: 35,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.9)",
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
