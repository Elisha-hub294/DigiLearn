import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export function ShareButton({
  onPress,
  accentColor = "#000000",
}: {
  onPress: () => void;
  accentColor?: string;
}) {
  const { colors } = useTheme();
  const activeAccent = accentColor === "#000000" ? colors.primary : accentColor;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Share note document"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: colors.lightBackground,
          borderColor: colors.border,
        },
        pressed && styles.pressed,
      ]}
      hitSlop={8}
    >
      <Feather name="share-2" size={20} color={activeAccent} />
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
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});
