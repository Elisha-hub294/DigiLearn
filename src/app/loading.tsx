import { useRouter } from "expo-router";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { colors } from "../constants/theme";

export default function LoadingScreen() {
  const router = useRouter();
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    translateY.value = withTiming(0, { duration: 700 });

    const timer = setTimeout(() => router.replace("/"), 1200);
    return () => clearTimeout(timer);
  }, [opacity, router, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={styles.container}>
      <Animated.Text style={[styles.title, animatedStyle]}>
        DigiLearn
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 36,
    fontWeight: "800",
    color: colors.primary,
    letterSpacing: 1,
  },
});
