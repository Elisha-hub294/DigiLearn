import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";

export function BookmarkButton({
  selected,
  onPress,
  accentColor = "#000000",
}: {
  selected: boolean;
  onPress: () => void;
  accentColor?: string;
}) {
  const activeAccent = accentColor || "#000000";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={selected ? "Remove bookmark" : "Bookmark note"}
      onPress={onPress}
      hitSlop={8}
    >
      <View
        style={[
          styles.button,
          selected
            ? [styles.selectedButton, { borderColor: `${activeAccent}44` }]
            : styles.unselectedButton,
        ]}
      >
        <Ionicons
          name={selected ? "bookmark" : "bookmark-outline"}
          size={22}
          color={selected ? activeAccent : "#475569"}
        />
      </View>
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
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
  },
});
