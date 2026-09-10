import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
export function PublishButton({
  onPress,
  disabled = false,
  disabledReason,
}: {
  onPress: () => void;
  disabled?: boolean;
  disabledReason?: string;
}) {
  return (
    <View>
      <Pressable
        accessibilityLabel="Publish"
        accessibilityRole="button"
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={disabled ? undefined : onPress}
        style={[s.button, disabled && s.disabledButton]}
      >
        <LinearGradient
          colors={disabled ? ["#9CA3AF", "#6B7280"] : ["#3F7BEB", "#E500C7"]}
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
      </Pressable>
      {disabled && disabledReason ? (
        <Text style={s.disabledReason}>{disabledReason}</Text>
      ) : null}
    </View>
  );
}
const s = StyleSheet.create({
  button: {
    height: 68,
    borderRadius: 18,
    overflow: "hidden",
    boxShadow: "0px 7px 12px rgba(63, 123, 235, 0.2)",
    elevation: 5,
  },
  disabledButton: {
    boxShadow: "none",
    elevation: 0,
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
  disabledReason: {
    color: "#6B7280",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
});
