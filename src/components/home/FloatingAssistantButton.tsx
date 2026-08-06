import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
    AppState,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import Animated, {
    Easing,
    FadeIn,
    FadeOut,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withSpring,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import fallbackAvatar from "../../../assets/images/tr-default.png";
import { colors, radius, shadows, spacing } from "../../constants/theme";
import {
    getAssistantContent,
    getCachedAssistantMessage,
    setCachedAssistantMessage,
} from "../../services/aiAssistantService";

const TYPING_INTERVAL_MS = 32;
const MESSAGE_PAUSE_MS = 50000;
const IDLE_FLOAT_DURATION_MS = 2600;
const MIN_TOUCH_SIZE = 44;

const getBubbleWidth = (width: number) =>
  Math.min(190, Math.max(150, width * 0.4));

export function FloatingAssistantButton() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<string[]>([]);
  const [activeMessage, setActiveMessage] = useState(
    "Need help with your studies?",
  );
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isScreenActive, setIsScreenActive] = useState(
    AppState.currentState === "active",
  );

  const bubbleWidth = useMemo(() => getBubbleWidth(width), [width]);

  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(16);
  const bubbleOpacity = useSharedValue(1);
  const bubbleScale = useSharedValue(1);
  const avatarTranslateY = useSharedValue(0);
  const typingIndex = useSharedValue(0);
  const currentMessage = useSharedValue(activeMessage);

  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        const content = await getAssistantContent();
        if (cancelled) {
          return;
        }

        const cachedMessage = getCachedAssistantMessage();
        const initialMessage =
          cachedMessage ??
          content.messages[0] ??
          "Need help with your studies?";

        setMessages(content.messages);
        setActiveMessage(initialMessage);
        currentMessage.value = initialMessage;
        setAvatarUri(content.avatar ?? null);
        setIsVisible(true);

        opacity.value = withSpring(1, { damping: 18, stiffness: 120 });
        translateY.value = withSpring(0, { damping: 18, stiffness: 120 });
        scale.value = withSpring(1, { damping: 18, stiffness: 120 });
      } catch (error) {
        if (!cancelled) {
          setMessages(["Need help with your studies?"]);
          setActiveMessage("Need help with your studies?");
          currentMessage.value = "Need help with your studies?";
          setAvatarUri(null);
          setIsVisible(true);
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, [currentMessage, opacity, scale, translateY]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      setIsScreenActive(nextState === "active");
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isVisible || messages.length === 0 || !isScreenActive) {
      return;
    }

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let animationFrame: ReturnType<typeof setTimeout> | undefined;
    let typingTimer: ReturnType<typeof setTimeout> | undefined;

    const animateMessageCycle = () => {
      const nextMessage = messages[Math.floor(Math.random() * messages.length)];
      if (!nextMessage) {
        return;
      }

      setCachedAssistantMessage(nextMessage);
      setActiveMessage(nextMessage);
      currentMessage.value = nextMessage;
      typingIndex.value = 0;
      bubbleOpacity.value = 1;
      bubbleScale.value = 1;

      const typeCharacters = () => {
        if (!isScreenActive) {
          return;
        }

        if (typingIndex.value >= nextMessage.length) {
          timeoutId = setTimeout(() => {
            bubbleOpacity.value = withTiming(0, {
              duration: 300,
              easing: Easing.in(Easing.ease),
            });
            bubbleScale.value = withTiming(0.96, {
              duration: 300,
              easing: Easing.in(Easing.ease),
            });
            animationFrame = setTimeout(() => {
              setActiveMessage(nextMessage);
              animateMessageCycle();
            }, 400);
          }, MESSAGE_PAUSE_MS);
          return;
        }

        const visibleText = nextMessage.slice(0, typingIndex.value + 1);
        setActiveMessage(visibleText);
        typingIndex.value = typingIndex.value + 1;
        typingTimer = setTimeout(typeCharacters, TYPING_INTERVAL_MS);
      };

      typeCharacters();
    };

    animateMessageCycle();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (animationFrame) {
        clearTimeout(animationFrame);
      }
      if (typingTimer) {
        clearTimeout(typingTimer);
      }
    };
  }, [
    isVisible,
    messages,
    bubbleOpacity,
    bubbleScale,
    currentMessage,
    typingIndex,
    isScreenActive,
  ]);

  useEffect(() => {
    avatarTranslateY.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 1600, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    );
  }, [avatarTranslateY]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const animatedBubbleStyle = useAnimatedStyle(() => ({
    opacity: bubbleOpacity.value,
    transform: [{ scale: bubbleScale.value }],
  }));

  const animatedAvatarStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: avatarTranslateY.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.96, { duration: 120 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 120 });
  };

  const handlePress = () => {
    router.push("/assistant");
  };

  const safeBottom = insets.bottom + 96;

  return (
    <Animated.View
      entering={FadeIn.duration(600)}
      exiting={FadeOut.duration(220)}
      style={[
        styles.wrapper,
        { bottom: safeBottom, right: 24, maxWidth: width - 32 },
      ]}
    >
      <Animated.View style={[styles.container, animatedContainerStyle]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open AI assistant"
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={({ pressed }) => [
            styles.touchTarget,
            pressed && styles.touchTargetPressed,
            {
              minHeight: MIN_TOUCH_SIZE,
              minWidth: MIN_TOUCH_SIZE,
            },
          ]}
        >
          <Animated.View style={[styles.bubbleWrapper, animatedBubbleStyle]}>
            <View style={[styles.messageBubble, { maxWidth: bubbleWidth }]}>
              <Text numberOfLines={2} style={styles.messageText}>
                {activeMessage}
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={[styles.avatarWrapper, animatedAvatarStyle]}>
            <Image
              source={avatarUri ? { uri: avatarUri } : fallbackAvatar}
              contentFit="contain"
              style={styles.avatar}
            />
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    zIndex: 20,
    elevation: 20,
    alignSelf: "flex-end",
  },
  container: {
    justifyContent: "flex-end",
    alignItems: "center",
    flexDirection: "row",
    pointerEvents: "box-none",
  },
  touchTarget: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    minHeight: 54,
  },
  touchTargetPressed: {
    transform: [{ scale: 0.98 }],
  },
  bubbleWrapper: {
    marginRight: -8,
    marginBottom: 10,
    zIndex: 2,
  },
  messageBubble: {
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    backgroundColor: colors.primary,
    ...shadows.soft,
    shadowColor: colors.primary,
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  messageText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.dark,
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  avatar: {
    width: 84,
    height: 84,
  },
});
