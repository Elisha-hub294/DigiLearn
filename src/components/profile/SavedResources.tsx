import { Feather } from "@expo/vector-icons";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";
import { savedResources } from "./profileData";
import { SavedItemCard } from "./SavedItemCard";
export function SavedResources() {
  const items = [...savedResources, ...savedResources];
  return (
    <View style={s.card}>
      <View style={s.head}>
        <View style={s.titleWrap}>
          <Feather name="bookmark" size={19} color="#171717" />
          <Text style={s.title}>Saved</Text>
        </View>
        <Text style={s.count}>6 resources</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.list}
      >
        {items.map((item, index) => (
          <SavedItemCard key={item.id + index} item={item} />
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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 19, fontWeight: "500", color: "#171717" },
  count: { fontSize: 12, color: "#777", fontWeight: "600" },
  list: { paddingHorizontal: spacing.lg, gap: 12 },
});
