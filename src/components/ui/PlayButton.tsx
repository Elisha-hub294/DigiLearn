import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PlayButton({ onPress, label = 'Play lesson' }: { onPress?: () => void; label?: string }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      accessibilityLabel={label}
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.9); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[styles.button, animatedStyle]}
    >
      <Ionicons name="play" size={34} color="#111" style={styles.icon} />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 32, elevation: 5, height: 64, justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 9, width: 64 },
  icon: { marginLeft: 3 },
});
