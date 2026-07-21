import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";
const data = [
  ["18", "Notes completed"],
  ["12", "Courses watched"],
  ["06", "Books read"],
];
export function ProfileStatsCard() {
  return (
    <View
      style={s.card}
      accessibilityLabel="Learning progress: 18 notes completed, 12 courses watched, 6 books read"
    >
      <View style={s.heading}>
        <View style={s.zap}>
          <Feather name="zap" size={17} color="#F59E0B" />
        </View>
        <Text style={s.headText}>7 day study streak</Text>
      </View>
      <View style={s.stats}>
        {data.map(([value, label], i) => (
          <View key={label} style={[s.stat, i > 0 && s.divider]}>
            <Text style={s.value}>{value}</Text>
            <Text style={s.label}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  heading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 17,
  },
  zap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFF4D6",
    alignItems: "center",
    justifyContent: "center",
  },
  headText: { color: "#171717", fontWeight: "500", fontSize: 15 },
  stats: { flexDirection: "row" },
  stat: { flex: 1, alignItems: "center", paddingHorizontal: 4 },
  divider: { borderLeftWidth: 1, borderLeftColor: "#E8E8E8" },
  value: { color: "#111", fontSize: 22, fontWeight: "500" },
  label: {
    color: "#777",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
    textAlign: "center",
  },
});
