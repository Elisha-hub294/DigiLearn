import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PlayButton({
  onPress,
  label = "Play lesson",
}: {
  onPress?: () => void;
  label?: string;
}) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.9);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[styles.button, animatedStyle]}
    >
      <Ionicons
        name="play"
        size={25}
        color={"white"}
        style={styles.icon}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: "center",
    backgroundColor: "rgba(255, 0, 0, 1)",
    borderRadius: 32,
    elevation: 5,
    height: 50,
    justifyContent: "center",
    width: 50,
  },
  icon: { marginLeft: 3 },
});
