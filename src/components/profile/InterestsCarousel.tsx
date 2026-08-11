import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { db } from "../../../firebaseConfig";
import { colors, shadows, spacing } from "../../constants/theme";
import { InterestCard } from "./InterestCard";
type Subject = {
  id: string;
  name: string;
  gradient?: string[];
  "png-icon"?: string;
  avatar?: string;
};
export function InterestsCarousel({ subjects }: { subjects: string[] }) {
  const [items, setItems] = useState<Subject[]>([]);
  useEffect(() => {
    let active = true;
    getDocs(collection(db, "subject"))
      .then((s) => {
        if (!active) return;
        const byName = new Map(
          s.docs.map((d) => {
            const data = d.data();
            return [
              String(data.name ?? "")
                .trim()
                .toLowerCase(),
              { id: d.id, ...data } as Subject,
            ];
          }),
        );
        setItems(
          subjects
            .map((name) => byName.get(name.trim().toLowerCase()))
            .filter(Boolean) as Subject[],
        );
      })
      .catch(() => active && setItems([]));
    return () => {
      active = false;
    };
  }, [subjects.join("|")]);
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
    ...shadows.soft,
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
