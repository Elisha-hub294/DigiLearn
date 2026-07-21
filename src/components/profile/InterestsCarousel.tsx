import { Feather } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";
import { InterestCard } from "./InterestCard";
import { interests } from "./profileData";
export function InterestsCarousel() {
  const items = [...interests, ...interests];
  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.title}>Interests</Text>
        <Feather name="more-horizontal" size={22} color="#606060" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.list}
      >
        {items.map((item, index) => (
          <InterestCard key={item.id + index} item={item} />
        ))}
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    paddingVertical: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  head: {
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: { fontSize: 19, fontWeight: "500", color: "#171717" },
  list: { paddingHorizontal: spacing.lg, gap: 10 },
});
