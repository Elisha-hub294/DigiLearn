import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { colors, radius, shadows, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

export function MessageComposer({
  value,
  onChangeText,
  onSend,
  disabled,
}: {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  disabled: boolean;
}) {
  const { colors: themeColors } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <View style={[styles.composer, { backgroundColor: themeColors.white }]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Type here"
          placeholderTextColor={themeColors.subtitle}
          style={[styles.input, { color: themeColors.text }]}
          multiline
          maxLength={500}
          returnKeyType="default"
          blurOnSubmit={false}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === "Enter") {
              if ((nativeEvent as any).shiftKey) {
                return;
              }
              if (!disabled) {
                onSend();
              }
            }
          }}
          onSubmitEditing={() => {
            if (!disabled) {
              onSend();
            }
          }}
        />

        <Animated.View style={animatedStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Send message"
            onPressIn={() => {
              scale.value = withSpring(0.95);
            }}
            onPressOut={() => {
              scale.value = withTiming(1, { duration: 120 });
            }}
            onPress={onSend}
            disabled={disabled}
            style={[
              styles.sendButton,
              { backgroundColor: themeColors.primary },
              disabled && styles.sendButtonDisabled,
            ]}
          >
            <Text style={styles.sendIcon}>➤</Text>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  input: {
    flex: 1,
    minHeight: 44,
    fontSize: 14,
    paddingVertical: 0,
    textAlignVertical: "center",
    textAlign: "left",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendIcon: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginTop: -2,
    marginLeft: 2,
  },
});
