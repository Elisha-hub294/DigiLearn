import { Pressable, StyleSheet, Text, View } from "react-native";
import { subjectColors, type SubjectKey } from "../constants/homeData";
import { colors, shadows, spacing } from "../constants/theme";

export const SubjectCard = ({
  subject,
}: {
  subject: { title: string; image?: any };
}) => {
  const accent = subjectColors[subject.title as SubjectKey] ?? "#3B82F6";
  return (
    <Pressable
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={subject.title}
    >
      <View style={[styles.iconWrap, { backgroundColor: accent }]}>
        <Text style={styles.iconText}>{subject.title.slice(0, 1)}</Text>
      </View>
      <Text style={styles.title}>{subject.title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 94,
    alignItems: "center",
    marginRight: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: 18,
    backgroundColor: colors.white,
    ...shadows.soft,
  },
  iconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  iconText: { color: colors.white, fontSize: 17, fontWeight: "800" },
  title: { color: colors.text, fontSize: 12, fontWeight: "700" },
});
