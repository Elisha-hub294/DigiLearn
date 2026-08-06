import { StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from "react-native-reanimated";

import { colors } from "../../constants/theme";

export function TypingIndicator() {
  const dot1 = useSharedValue(0.7);
  const dot2 = useSharedValue(0.7);
  const dot3 = useSharedValue(0.7);

  const createAnimatedStyle = (shared: ReturnType<typeof useSharedValue<number>>) =>
    useAnimatedStyle(() => ({ opacity: shared.value }));

  const dot1Style = createAnimatedStyle(dot1);
  const dot2Style = createAnimatedStyle(dot2);
  const dot3Style = createAnimatedStyle(dot3);

  dot1.value = withRepeat(withSequence(withTiming(1, { duration: 400 }), withTiming(0.7, { duration: 400 })), -1, true);
  dot2.value = withRepeat(withSequence(withTiming(1, { duration: 500 }), withTiming(0.7, { duration: 500 })), -1, true);
  dot3.value = withRepeat(withSequence(withTiming(1, { duration: 600 }), withTiming(0.7, { duration: 600 })), -1, true);

  return (
    <View style={styles.row}>
      <Animated.Text style={[styles.dot, dot1Style]}>●</Animated.Text>
      <Animated.Text style={[styles.dot, dot2Style]}>●</Animated.Text>
      <Animated.Text style={[styles.dot, dot3Style]}>●</Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
  },
  dot: {
    color: colors.primary,
    fontSize: 14,
  },
});
