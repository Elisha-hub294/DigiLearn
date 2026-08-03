import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type RecentSearchChipProps = {
  term: string;
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
};

export function RecentSearchChip({
  term,
  onSelect,
  onRemove,
}: RecentSearchChipProps) {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const displayTerm =
    term.length > 20 ? `${term.slice(0, 20)}...` : term;

  const handleRemove = () => {
    opacity.value = withTiming(0, { duration: 200 });
    scale.value = withTiming(0.8, { duration: 200 });

    setTimeout(() => {
      onRemove(term);
    }, 200);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.chip, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Search for ${term}`}
        onPress={() => onSelect(term)}
        style={styles.textArea}
      >
        <Text style={styles.termText} numberOfLines={1} ellipsizeMode="tail">
          {displayTerm}
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${term} from recent searches`}
        hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
        onPress={handleRemove}
        style={styles.closeButton}
      >
        <Feather name="x" size={14} color="#666666" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 34,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#BEBEBE",
    paddingLeft: 16,
    paddingRight: 10,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
    marginBottom: 10,
    maxWidth: 240,
  },
  textArea: {
    justifyContent: "center",
    paddingRight: 6,
    flexShrink: 1,
  },
  termText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#333333",
  },
  closeButton: {
    minWidth: 20,
    minHeight: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
