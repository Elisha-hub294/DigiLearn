import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { colors, radius, shadows, spacing } from "../../constants/theme";

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
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <View style={styles.composer}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder="Type here"
          placeholderTextColor="#A0A0A0"
          style={styles.input}
          multiline
          maxLength={500}
          returnKeyType="send"
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
            style={[styles.sendButton, disabled && styles.sendButtonDisabled]}
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
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft,
  },
  input: {
    flex: 1,
    minHeight: 44,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#3B82F6",
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
  },
});
