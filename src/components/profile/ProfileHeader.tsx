import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { ZoomIn } from "react-native-reanimated";
import { colors, radius, shadows, spacing } from "../../constants/theme";
export function ProfileHeader() {
  return (
    <View style={s.card}>
      <Pressable
        accessibilityLabel="Profile options"
        accessibilityRole="button"
        style={s.menu}
      >
        <Feather name="more-horizontal" size={24} color="#606060" />
      </Pressable>
      <Animated.View
        entering={ZoomIn.delay(150).duration(480)}
        style={s.avatarWrap}
      >
        <Image
          source={require("../../../assets/images/tr-2.jpg")}
          style={s.avatar}
          contentFit="cover"
          accessibilityLabel="Elisha Bagalwa profile picture"
        />
        <Pressable
          accessibilityLabel="Edit profile picture"
          accessibilityRole="button"
          style={s.camera}
        >
          <Feather name="camera" size={14} color="#fff" />
        </Pressable>
      </Animated.View>
      <Text allowFontScaling style={s.name}>
        Elisha Bagalwa
      </Text>
      <Text allowFontScaling style={s.email}>
        elishabagalw@gmail.com
      </Text>
      <View style={s.badge}>
        <Text style={s.badgeText}>Student Account</Text>
      </View>
      <Pressable
        accessibilityLabel="Edit profile"
        accessibilityRole="button"
        style={s.edit}
      >
        <Feather name="edit-2" size={15} color={colors.primary} />
        <Text style={s.editText}>Edit profile</Text>
      </Pressable>
    </View>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: spacing.lg,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  menu: {
    position: "absolute",
    right: 12,
    top: 12,
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarWrap: {
    width: 118,
    height: 118,
    borderRadius: 59,
    padding: 3,
    backgroundColor: "#fff",
    ...shadows.soft,
    marginTop: 8,
    marginBottom: 14,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 56 },
  camera: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  name: {
    fontSize: 30,
    lineHeight: 37,
    fontWeight: "500",
    color: "#111",
    textAlign: "center",
  },
  email: { fontSize: 15, lineHeight: 22, color: "#777", marginTop: 3 },
  badge: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: "#3B82F6",
  },
  badgeText: { color: "#fff", fontSize: 13, fontWeight: "500" },
  edit: {
    minHeight: 44,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
  },
  editText: { color: colors.primary, fontSize: 14, fontWeight: "700" },
});
