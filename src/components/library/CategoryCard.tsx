import { Image } from "expo-image";
import React, { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";
import { colors, radius, shadows, spacing } from "../../constants/theme";

type CategoryItem = {
  id: string;
  label: string;
  icon: any;
};

type CategoryCardProps = {
  item: CategoryItem;
};

export function CategoryCard({ item }: CategoryCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 140 });
  }, [scale]);

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.label}
        onPressIn={() => {
          scale.value = withSpring(0.96);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={styles.touchTarget}
      >
        <View style={styles.iconWrap}>
          <Image source={item.icon} style={styles.icon} contentFit="fill" />
        </View>
        <Text style={styles.label}>{item.label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 110,
    minHeight: 118,
    marginRight: spacing.sm,
    ...shadows.soft,
  },
  touchTarget: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 88,
  },
  iconWrap: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  icon: {
    width: 70,
    height: 70,
    borderRadius: radius.md,
  },
  label: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});
