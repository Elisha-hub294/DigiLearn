import MaskedView from "@react-native-masked-view/masked-view";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { colors, radius, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

const GradientTitle = ({
  text,
  style,
}: {
  text: string;
  style?: StyleProp<TextStyle>;
}) => {
  if (Platform.OS === "web") {
    const webStyle = {
      ...(style ?? {}),
      ...(styles.webGradientTitle as unknown as TextStyle),
    } as TextStyle;

    return <Text style={webStyle}>{text}</Text>;
  }

  return (
    <MaskedView
      style={styles.gradientTitleMask}
      maskElement={
        <Text style={[style, { backgroundColor: "transparent" }]}>{text}</Text>
      }
    >
      <LinearGradient
        colors={["#3b82f6", "#8b5cf6", "#f59e0b"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientTitleGradient}
      >
        <Text style={[style, styles.gradientTitleText]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

export function AssistantHeader({
  title,
  subtitle,
  quotaBadge,
  onBack,
}: {
  title: string;
  subtitle: string;
  quotaBadge?: string;
  onBack?: () => void;
}) {
  const { colors: themeColors, isDark } = useTheme();
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
            tint={isDark ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
      </Animated.View>

      <View style={styles.headerTextWrap}>
        <View style={styles.titleRow}>
          <GradientTitle
            text={title}
            style={[styles.headerTitle, { color: themeColors.text }]}
          />
          {quotaBadge && (
            <View
              style={[
                styles.quotaPill,
                {
                  backgroundColor: themeColors.successBackground,
                  borderColor: themeColors.success,
                },
              ]}
            >
              <Text style={[styles.quotaText, { color: themeColors.success }]}>
                {quotaBadge}
              </Text>
            </View>
          )}
        </View>
        <Text style={[styles.headerSubtitle, { color: themeColors.subtitle }]}>
          {subtitle}
        </Text>
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
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  quotaPill: {
    backgroundColor: "rgba(22, 101, 52, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(34, 197, 94, 0.3)",
  },
  quotaText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16A34A",
  },
  gradientTitleMask: {
    alignSelf: "flex-start",
  },
  gradientTitleGradient: {
    flex: 1,
    justifyContent: "center",
  },
  gradientTitleText: {
    opacity: 0,
  },
  webGradientTitle: {
    backgroundImage:
      "linear-gradient(90deg, #3b82f6 0%, #8b5cf6 45%, #f59e0b 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  } as TextStyle,
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
