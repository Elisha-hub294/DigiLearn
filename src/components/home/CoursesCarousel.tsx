import { Image } from "expo-image";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, radius, shadows, spacing } from "../../constants/theme";

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
  const data = [...items, ...items, ...items];

  return (
    <Animated.View entering={FadeInUp.duration(540)} style={styles.container}>
      <FlatList
        horizontal
        data={data}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <Pressable style={styles.card} accessibilityRole="button">
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
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.teacher}>{item.teacher}</Text>
              <View style={styles.buttonWrap}>
                <Text style={styles.openText}>Open Course</Text>
              </View>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  list: {
    paddingRight: spacing.md,
    paddingVertical: spacing.lg,
  },
  card: {
    width: 220,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 22,
    overflow: "hidden",
    ...shadows.card,
  },
  imageWrap: { height: 132, position: "relative" },
  image: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.24)" },
  playButton: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  playText: { color: colors.text, fontSize: 14, marginLeft: 2 },
  durationBadge: {
    position: "absolute",
    right: spacing.md,
    top: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  durationText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  body: { padding: spacing.md },
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
    backgroundColor: "#EFF6FF",
  },
  openText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
});
