import { Feather as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";

type SearchBarProps = {
  placeholder?: string;
  accessibilityLabel?: string;
  onPress?: () => void;
};

export function SearchBar({
  placeholder = "Search by subject, title, etc",
  accessibilityLabel = "Open search screen",
  onPress,
}: SearchBarProps) {
  const router = useRouter();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/search" as never);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={handlePress}
      style={styles.container}
    >
      <Icon name="search" size={18} color="#8A8A8A" />
      <Text style={styles.placeholderText} numberOfLines={1}>
        {placeholder}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    paddingHorizontal: spacing.md,
    borderRadius: 100,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#D9D9D9",
    marginBottom: spacing.xl,
  },
  placeholderText: {
    flex: 1,
    marginLeft: spacing.sm,
    color: "#8A8A8A",
    fontSize: 14,
  },
});
