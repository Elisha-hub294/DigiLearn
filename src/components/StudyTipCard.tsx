import { Feather as Icon } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { studyTip } from "../constants/homeData";
import { colors, radius, shadows, spacing } from "../constants/theme";

export const StudyTipCard = () => {
  return (
    <Animated.View entering={FadeInUp.duration(540)} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Icon name="sun" size={18} color={colors.white} />
        </View>
        <View style={styles.textWrap}>
          <Text style={styles.title}>{studyTip.title}</Text>
          <Text style={styles.subtitle}>{studyTip.streak}</Text>
        </View>
      </View>
      <Text style={styles.body}>{studyTip.body}</Text>
      <Text style={styles.goal}>{studyTip.goal}</Text>
      <Pressable style={styles.button} accessibilityLabel="View study tips">
        <Text style={styles.buttonText}>Read more</Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: spacing.lg,
    ...shadows.card,
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  textWrap: { flex: 1 },
  title: { color: colors.text, fontSize: 15, fontWeight: "800" },
  subtitle: { color: colors.subtitle, fontSize: 12, marginTop: 2 },
  body: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  goal: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  button: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: "#EFF6FF",
  },
  buttonText: { color: colors.primary, fontSize: 12, fontWeight: "700" },
});
