import { Feather as Icon } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { continueLearning, subjectColors } from "../constants/homeData";
import { colors, radius, shadows, spacing } from "../constants/theme";

export const ContinueLearningCard = () => {
  const accent = subjectColors[continueLearning.subject] ?? colors.primary;

  return (
    <Animated.View entering={FadeInUp.duration(480)} style={styles.card}>
      <View style={styles.left}>
        <Text style={styles.label}>Continue Learning</Text>
        <Text style={styles.topic}>{continueLearning.topic}</Text>
        <Text style={styles.subtitle}>{continueLearning.subtitle}</Text>
        <View style={styles.row}>
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Text style={styles.badgeText}>{continueLearning.subject}</Text>
          </View>
          <Text style={styles.progress}>{continueLearning.progress}</Text>
        </View>
      </View>
      <Pressable style={styles.iconButton} accessibilityLabel="Resume learning">
        <Icon name="play" size={16} color={colors.white} />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: spacing.lg,
    ...shadows.card,
    marginBottom: spacing.xl,
  },
  left: { flex: 1, paddingRight: spacing.md },
  label: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  topic: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: colors.subtitle,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  progress: { color: colors.text, fontSize: 12, fontWeight: "700" },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
