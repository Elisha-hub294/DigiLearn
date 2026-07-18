import { Image } from "expo-image";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { courses, type CourseItem } from "../constants/homeData";
import { colors, radius, shadows, spacing } from "../constants/theme";

export const CoursesCarousel = () => {
  const data = [...courses, ...courses];

  return (
    <Animated.View entering={FadeInUp.duration(550)}>
      <FlatList
        horizontal
        data={data}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => <CourseCard item={item} />}
        contentContainerStyle={styles.list}
      />
    </Animated.View>
  );
};

const CourseCard = ({ item }: { item: CourseItem }) => (
  <Pressable style={styles.card} accessibilityRole="button">
    <View style={styles.imageWrap}>
      <Image source={item.image} style={styles.image} contentFit="cover" />
      <View style={styles.overlay} />
      <View style={styles.playButton}>
        <Text style={styles.playText}>▶</Text>
      </View>
    </View>
    <View style={styles.body}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.teacher}>{item.teacher}</Text>
      <View style={styles.bottomRow}>
        <View style={[styles.durationBadge, { backgroundColor: item.accent }]}>
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
        <Text style={styles.openText}>Open course</Text>
      </View>
    </View>
  </Pressable>
);

const styles = StyleSheet.create({
  list: { paddingRight: spacing.md },
  card: {
    width: 220,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 22,
    overflow: "hidden",
    ...shadows.card,
  },
  imageWrap: { height: 130, position: "relative" },
  image: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.25)" },
  playButton: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  playText: { fontSize: 16, color: colors.text, marginLeft: 2 },
  body: { padding: spacing.md },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  teacher: { color: colors.subtitle, fontSize: 12, marginBottom: spacing.md },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  durationBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  durationText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  openText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
});
