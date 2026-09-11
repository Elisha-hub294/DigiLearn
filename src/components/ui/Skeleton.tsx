import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Animated,
  Platform,
  StyleProp,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

const AnimatedGradient = Animated.createAnimatedComponent(LinearGradient);

type SkeletonProps = {
  style?: StyleProp<ViewStyle>;
};

export function Skeleton({ style }: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const [opacity] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: Platform.OS !== "web",
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessible={false}
      style={[
        styles.base,
        { backgroundColor: colors.skeleton },
        style,
        { opacity },
      ]}
    >
      <AnimatedGradient
        colors={
          isDark
            ? ["transparent", colors.skeletonHighlight, "transparent"]
            : ["transparent", colors.skeletonHighlight, "transparent"]
        }
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[
          StyleSheet.absoluteFill,
          styles.glow,
          { opacity, pointerEvents: "none" },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 6,
  },
  glow: {
    borderRadius: 6,
  },
});
