import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import { Animated, StyleProp, StyleSheet, ViewStyle } from "react-native";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

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
    <Animated.View accessible={false} style={[styles.base, style, { opacity }]}>
      <AnimatedGradient
        colors={["transparent", "rgba(255, 255, 255, 0.72)", "transparent"]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFillObject, styles.glow, { opacity }]}
        pointerEvents="none"
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#E2E8F0",
    borderRadius: 6,
  },
  glow: {
    borderRadius: 6,
  },
});
