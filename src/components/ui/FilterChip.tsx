import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";

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
  const { colors } = useTheme();
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
      style={[
        styles.chip,
        { backgroundColor: colors.white, borderColor: colors.inactive },
        selected && {
          backgroundColor: colors.primary,
          borderColor: colors.primary,
        },
        animatedStyle,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: selected ? colors.white : colors.inactive },
        ]}
      >
        {label}
      </Text>
    </AnimatedPressable>
  );
}
const styles = StyleSheet.create({
  chip: {
    borderRadius: 100,
    borderWidth: 1,
    marginRight: 10,
    paddingHorizontal: 18,
    paddingVertical: 7,
  },
  selected: {},
  text: { fontSize: 12, fontWeight: "600" },
});
