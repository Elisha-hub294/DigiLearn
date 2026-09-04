import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";
import { loadSubjects, SubjectRecord } from "../../services/subjectsService";
import { InterestCard } from "./InterestCard";
export function InterestsCarousel({ subjects }: { subjects: string[] }) {
  const [items, setItems] = useState<SubjectRecord[]>([]);
  const subjectKey = subjects.join("|");
  useEffect(() => {
    let active = true;
    loadSubjects()
      .then((subjectsList) => {
        if (!active) return;
        const byName = new Map(
          subjectsList.map((subject) => [
            subject.name.trim().toLowerCase(),
            subject,
          ]),
        );
        setItems(
          subjects
            .map((name) => byName.get(name.trim().toLowerCase()))
            .filter(Boolean) as SubjectRecord[],
        );
      })
      .catch(() => active && setItems([]));
    return () => {
      active = false;
    };
  }, [subjectKey, subjects]);
  return (
    <View style={s.card}>
      <Text style={s.title}>Interests</Text>
      {items.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.list}
        >
          {items.map((item) => (
            <InterestCard key={item.id} item={item} />
          ))}
        </ScrollView>
      ) : (
        <Text style={s.empty}>
          Choose subjects to personalize your learning.
        </Text>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: spacing.lg,
  },
  title: {
    paddingHorizontal: spacing.lg,
    fontSize: 19,
    fontWeight: "700",
    color: "#171717",
    marginBottom: 12,
  },
  list: { paddingHorizontal: spacing.lg, gap: 10 },
  empty: {
    paddingHorizontal: spacing.lg,
    color: colors.subtitle,
    fontSize: 14,
  },
});
