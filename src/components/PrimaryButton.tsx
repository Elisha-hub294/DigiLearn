import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors, radius, spacing } from "../constants/theme";

export const PrimaryButton = ({
  title,
  onPress,
}: {
  title: string;
  onPress?: () => void;
}) => (
  <Pressable onPress={onPress} accessibilityRole="button" style={styles.button}>
    <LinearGradient
      colors={["#6AD7FF", "#D94FFF"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
    <Text style={styles.text}>{title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    overflow: "hidden",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    minHeight: 42,
    justifyContent: "center",
  },
  text: { color: colors.white, fontWeight: "700", fontSize: 13 },
});
