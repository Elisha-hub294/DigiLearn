import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";

export function SearchSkeleton() {
  const { colors } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.9, { duration: 750 }), -1, true);
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((key) => (
        <Animated.View key={key} style={[styles.card, animatedStyle]}>
          <View
            style={[styles.imageSkeleton, { backgroundColor: colors.border }]}
          />
          <View style={styles.textSkeletonContainer}>
            <View
              style={[styles.titleSkeleton, { backgroundColor: colors.border }]}
            />
            <View
              style={[
                styles.descSkeleton,
                { backgroundColor: colors.lightBackground },
              ]}
            />
          </View>
        </Animated.View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  card: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  imageSkeleton: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  textSkeletonContainer: {
    flex: 1,
    gap: 8,
  },
  titleSkeleton: {
    width: "70%",
    height: 18,
    borderRadius: 4,
  },
  descSkeleton: {
    width: "90%",
    height: 14,
    borderRadius: 4,
  },
});
