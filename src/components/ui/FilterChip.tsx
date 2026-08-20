import { colors } from "@/constants/theme";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
export function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const pressed = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(pressed.value, { duration: 120 }) }],
  }));
  return (
    <AnimatedPressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onPressIn={() => {
        pressed.value = 0.95;
      }}
      onPressOut={() => {
        pressed.value = 1;
      }}
      style={[styles.chip, selected && styles.selected, animatedStyle]}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>
        {label}
      </Text>
    </AnimatedPressable>
  );
}
const styles = StyleSheet.create({
  chip: {
    backgroundColor: "#fff",
    borderColor: colors.inactive,
    borderRadius: 100,
    borderWidth: 1,
    marginRight: 10,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  selected: {
    backgroundColor: colors.primaryRed,
    borderColor: colors.primaryRed,
  },
  text: { color: colors.inactive, fontSize: 12, fontWeight: "600" },
  selectedText: { color: "#fff" },
});
