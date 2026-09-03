import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { TopicalNote } from "./pageTypes";
import { SimilarPageCard } from "./SimilarPageCard";

export function SimilarPages({
  pages,
  onSelectPage,
  onSeeAll,
  accentColor = "#000000",
}: {
  pages: TopicalNote[];
  onSelectPage: (id: string) => void;
  onSeeAll?: () => void;
  accentColor?: string;
}) {
  if (!pages || pages.length === 0) return null;

  const activeAccent = accentColor || "#000000";

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.heading}>Similar Pages</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="See all similar pages"
          onPress={onSeeAll}
          hitSlop={8}
        >
          <Text style={[styles.seeAllText, { color: activeAccent }]}>
            See all
          </Text>
        </Pressable>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {pages.map((page, index) => (
          <SimilarPageCard
            key={page.id}
            page={page}
            index={index}
            onPress={() => onSelectPage(page.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  heading: {
    fontSize: 21,
    color: "#1B2730",
    fontWeight: "600",
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "600",
  },
  list: {
    paddingRight: 24,
  },
});
