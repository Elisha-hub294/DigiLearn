import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, shadows } from "../../constants/theme";
import type { UserProfile } from "../../services/userProfile";

const fallbackAvatar = require("../../../assets/images/user-default.png");
export function ProfileHeader({
  profile,
  photoURL,
}: {
  profile: UserProfile;
  photoURL?: string | null;
}) {
  const router = useRouter();
  const requestedUri = photoURL || profile.photoURL;
  const [uri, setUri] = useState(requestedUri);
  useEffect(() => setUri(requestedUri), [requestedUri]);
  return (
    <View style={s.wrap}>
      <View style={s.banner}>
        <Pressable
          onPress={() => router.push("/settings")}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          style={s.settings}
        >
          <Feather name="settings" size={20} color="#F8FAFC" />
        </Pressable>
      </View>
      <View style={s.sheet}>
        <View style={s.avatarWrap}>
          <Image
            source={uri ? { uri } : fallbackAvatar}
            placeholder={fallbackAvatar}
            onError={() => setUri("")}
            style={s.avatar}
            contentFit="cover"
            accessibilityLabel="User profile picture"
          />
        </View>
        <Text style={s.name}>{profile.name}</Text>
        {profile.bio ? (
          <Text style={s.bio}>{profile.bio}</Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add your bio"
            hitSlop={8}
          >
            <Text style={s.addBio}>✎ Talk about yourself</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: {
    overflow: "hidden",
    backgroundColor: colors.white,
    ...shadows.soft,
  },
  banner: { height: 132, backgroundColor: colors.primary },
  settings: {
    position: "absolute",
    right: 14,
    top: 13,
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0, 28, 81, 0.48)",
    alignItems: "center",
    justifyContent: "center",
  },
  sheet: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
    minHeight: 130,
  },
  avatarWrap: {
    width: 120,
    height: 120,
    borderRadius: 999,
    backgroundColor: "#fff",
    padding: 4,
    marginTop: -60,
    marginBottom: 10,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 999 },
  name: {
    fontSize: 25,
    fontWeight: "600",
    color: colors.text,
    textAlign: "center",
  },
  bio: {
    color: colors.subtitle,
    lineHeight: 20,
    fontSize: 14,
    textAlign: "center",
    marginTop: 7,
  },
  addBio: {
    color: colors.primary,
    fontSize: 14,
    marginTop: 8,
    fontWeight: "600",
  },
});
