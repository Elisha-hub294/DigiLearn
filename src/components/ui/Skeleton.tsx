import { useEffect, useState } from "react";
import { Animated, StyleProp, StyleSheet, ViewStyle } from "react-native";

type SkeletonProps = {
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ style }: SkeletonProps) {
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessible={false}
      style={[styles.base, style, { opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
  },
});
