import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";
export function AboutCard() {
  return (
    <View style={s.card}>
      <View style={s.head}>
        <Text style={s.title}>About me</Text>
        <Pressable
          accessibilityLabel="About me options"
          accessibilityRole="button"
          style={s.menu}
        >
          <Feather name="more-horizontal" size={22} color="#606060" />
        </Pressable>
      </View>
      <Text allowFontScaling style={s.body}>
        Passionate self-taught software developer focused on building
        educational technology that empowers students to learn more effectively.
        I enjoy creating beautiful mobile applications, solving programming
        challenges, and making quality education accessible to everyone.
      </Text>
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
  head: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  title: { color: "#171717", fontSize: 19, fontWeight: "500" },
  menu: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: -10,
  },
  body: { color: "#555", fontSize: 14, lineHeight: 22 },
});
