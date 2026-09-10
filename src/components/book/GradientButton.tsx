import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text } from "react-native";

export function GradientButton({
  colors,
  onPress,
  label = "Contact seller",
}: {
  colors: readonly [string, string];
  onPress: () => void;
  label?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.wrap}
    >
      <LinearGradient
        colors={[...colors]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.button}
      >
        <Text allowFontScaling style={styles.text}>
          {label}
        </Text>
      </LinearGradient>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  wrap: { flex: 1, marginHorizontal: 12 },
  button: {
    height: 58,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  text: { color: "white", fontSize: 18, fontWeight: "700" },
});
