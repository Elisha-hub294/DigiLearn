import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function OpenButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open document PDF"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.96);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={styles.wrap}
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        <Text allowFontScaling style={styles.text}>
          Open
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    marginHorizontal: 10,
    height: 58,
  },
  button: {
    width: "100%",
    height: 58,
    borderRadius: 30,
    backgroundColor: "#6C4DD9",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6C4DD9",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "600",
  },
});
