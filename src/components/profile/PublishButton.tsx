import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
const A = Animated.createAnimatedComponent(Pressable);
export function PublishButton({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <A
      accessibilityLabel="Publish"
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.97);
      }}
      onPressOut={() => {
        scale.value = withSpring(1);
      }}
      style={[s.button, style]}
    >
      <LinearGradient
        colors={["#3F7BEB", "#E500C7"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.gradient}
      >
        <View style={s.content}>
          <View style={s.iconCircle}>
            <Feather name="plus" size={16} color="#3F7BEB" />
          </View>
          <View>
            <Text style={s.eyebrow}>ADMIN STUDIO</Text>
            <Text style={s.text}>Publish a learning update</Text>
          </View>
          <Feather name="arrow-up-right" size={19} color="#FFFFFF" />
        </View>
      </LinearGradient>
    </A>
  );
}
const s = StyleSheet.create({
  button: {
    height: 68,
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#3F7BEB",
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  gradient: { flex: 1, alignItems: "center", justifyContent: "center" },
  content: {
    width: "100%",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  eyebrow: {
    color: "rgba(255,255,255,0.76)",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.4,
  },
  text: { color: "#fff", fontSize: 16, fontWeight: "700", marginTop: 2 },
});
