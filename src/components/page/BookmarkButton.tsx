import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

export function BookmarkButton({
  selected,
  onPress,
}: {
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(1.25, { damping: 4, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 6, stiffness: 200 });
    });
    onPress();
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={selected ? "Remove bookmark" : "Bookmark note"}
      onPress={handlePress}
      hitSlop={8}
    >
      <Animated.View
        style={[
          styles.button,
          selected ? styles.selectedButton : styles.unselectedButton,
          animatedStyle,
        ]}
      >
        <Ionicons
          name={selected ? "bookmark" : "bookmark-outline"}
          size={22}
          color={selected ? "#6C4DD9" : "#475569"}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  unselectedButton: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  selectedButton: {
    backgroundColor: "#F4F0FF",
    borderWidth: 1,
    borderColor: "#D8CCFF",
  },
});
