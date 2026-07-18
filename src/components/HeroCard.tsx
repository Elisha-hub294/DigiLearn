import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing } from "../constants/theme";

export const HeroCard = ({ item, width }: { item: any; width: number }) => {
  const pressScale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.97, { duration: 120 });
  };

  const handlePressOut = () => {
    pressScale.value = withSequence(
      withTiming(1.03, { duration: 100 }),
      withTiming(1, { duration: 120 }),
    );
  };

  return (
    <Animated.View
      style={[
        styles.card,
        { width, backgroundColor: item.color },
        animatedStyle,
      ]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.inner}
        accessibilityRole="button"
      >
        <View style={styles.textBlock}>
          <Text
            style={[styles.title, { color: item.titleColor ?? colors.text }]}
          >
            {item.title}
          </Text>
          {item.subtitle ? (
            <Text style={styles.subtitle}>{item.subtitle}</Text>
          ) : null}
          <View style={styles.ctaButton}>
            <Text
              style={[
                styles.ctaText,
                { color: item.titleColor ?? colors.primary },
              ]}
            >
              {item.cta}
            </Text>
          </View>
        </View>
        <View style={styles.imageWrap}>
          <item.image style={styles.image} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 22,
    padding: spacing.lg,
    marginRight: 16,
    overflow: "hidden",
    shadowColor: "#0F172A",
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textBlock: { flex: 0.6, paddingRight: spacing.sm },
  title: {
    fontSize: 20,
    fontWeight: "800",
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  subtitle: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  ctaButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.white,
    paddingVertical: 9,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
  },
  ctaText: { fontWeight: "700", fontSize: 13 },
  imageWrap: { flex: 0.4, alignItems: "center", justifyContent: "center" },
  image: { width: 110, height: 110, resizeMode: "contain" },
});
