import { Image } from "expo-image";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, radius, spacing } from "../../constants/theme";
import { useTrendingLessons } from "../../hooks/useTrendingLessons";

export const CoursesCarousel = () => {
  const { width } = useWindowDimensions();
  const { lessons, loading, error } = useTrendingLessons();
  const cardWidth = width >= 900 ? 240 : 220;

  if (loading) {
    return (
      <View style={styles.loaderWrap}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (error || lessons.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyText}>
          {error ?? "No courses available yet."}
        </Text>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(540)}>
      <FlatList
        horizontal
        data={lessons}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => {
          const displayTitle =
            item.title.length > 22
              ? `${item.title.slice(0, 22)}...`
              : item.title;

          return (
            <Pressable
              style={[styles.card, { width: cardWidth }]}
              accessibilityRole="button"
            >
              <View style={styles.imageWrap}>
                {item.thumbnail ? (
                  <Image
                    source={{ uri: item.thumbnail }}
                    style={styles.image}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.image, styles.imagePlaceholder]} />
                )}
                <View style={styles.overlay} />
                <View style={styles.playButton}>
                  <Text style={styles.playText}>▶</Text>
                </View>
                {!!item.duration && (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationText}>{item.duration}</Text>
                  </View>
                )}
              </View>
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={2}>
                  {displayTitle}
                </Text>
                <Text style={styles.teacher} numberOfLines={1}>
                  {item.teacher}
                </Text>
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
  loaderWrap: {
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyWrap: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
  },
  emptyText: {
    color: colors.subtitle,
    fontSize: 13,
    textAlign: "center",
  },
  list: {
    paddingVertical: spacing.sm,
  },
  card: {
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  imageWrap: { height: 132, position: "relative" },
  image: { width: "100%", height: "100%" },
  imagePlaceholder: { backgroundColor: "#E2E8F0" },
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
