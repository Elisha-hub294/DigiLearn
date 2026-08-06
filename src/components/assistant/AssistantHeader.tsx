import { BlurView } from "expo-blur";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { colors, radius, spacing } from "../../constants/theme";

export function AssistantHeader({
  title,
  subtitle,
  onBack,
}: {
  title: string;
  subtitle: string;
  onBack?: () => void;
}) {
  const router = useRouter();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace("/");
  };

  return (
    <View style={styles.headerRow}>
      <Animated.View style={animatedStyle}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPressIn={() => {
            scale.value = withSpring(0.94);
          }}
          onPressOut={() => {
            scale.value = withTiming(1, { duration: 120 });
          }}
          onPress={handleBack}
          style={styles.backButton}
        >
          <BlurView
            intensity={24}
            tint="light"
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.headerTextWrap}>
        <Text style={styles.headerTitle}>{title}</Text>
        <Text style={styles.headerSubtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  backIcon: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "700",
    marginTop: -5,
  },
  headerTextWrap: {
    flex: 1,
    alignItems: "flex-end",
  },
  headerTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: colors.subtitle,
    fontSize: 12,
    marginTop: 2,
  },
});
