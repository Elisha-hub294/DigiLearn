import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { colors } from "../../constants/theme";
import { getThemeAsset } from "../../constants/themeAssets";
import { useTheme } from "../../contexts/ThemeContext";
import type { UserProfile } from "../../services/userProfile";

export function ProfileHeader({
  profile,
  photoURL,
}: {
  profile: UserProfile;
  photoURL?: string | null;
}) {
  const router = useRouter();
  const { colors: themeColors, isDark } = useTheme();
  const fallbackAvatar = getThemeAsset("userDefault", isDark);
  const { width } = useWindowDimensions();
  const requestedUri = photoURL || profile.photoURL;
  const [uri, setUri] = useState(requestedUri);
  const avatarSize = Math.min(150, Math.max(104, width * 0.32));
  useEffect(() => setUri(requestedUri), [requestedUri]);
  return (
    <View style={[s.wrap, { backgroundColor: themeColors.white }]}>
      <View style={s.banner}>
        {profile.type === "admin" && (
          <LinearGradient
            colors={["rgba(255,255,255,0.18)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.adminBadge}
          >
            <Text style={s.adminText}>ADMIN</Text>
          </LinearGradient>
        )}
        <Pressable
          onPress={() => router.push("/settings")}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          style={s.settings}
        >
          <Feather name="settings" size={20} color="#F8FAFC" />
        </Pressable>
      </View>
      <View style={[s.sheet, { backgroundColor: themeColors.white }]}>
        <View
          style={[
            s.avatarWrap,
            { backgroundColor: themeColors.white },
            {
              width: avatarSize,
              height: avatarSize,
              marginTop: -avatarSize * 0.47,
            },
          ]}
        >
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
  },
  banner: {
    height: 132,
    backgroundColor: colors.primaryDark,
    overflow: "hidden",
  },
  adminBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderBottomRightRadius: 14,
    opacity: 0.72,
  },
  adminText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 3,
    textTransform: "uppercase",
  },
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
    borderRadius: 999,
    padding: 4,
    marginBottom: 10,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 999 },
  name: {
    fontSize: 25,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  bio: {
    color: colors.subtitle,
    lineHeight: 20,
    fontSize: 15,
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
