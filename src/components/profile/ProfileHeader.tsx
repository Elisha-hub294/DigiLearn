import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import { FirebaseImage } from "../ui/FirebaseImage";

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
  const accentColor = profile.accent || themeColors.primaryDark;
  const { width } = useWindowDimensions();
  const requestedUri = photoURL || profile.photoURL;
  const avatarSize = Math.min(150, Math.max(104, width * 0.32));
  return (
    <View style={[s.wrap, { backgroundColor: themeColors.white }]}>
      <View style={[s.banner, { backgroundColor: accentColor }]}>
        {profile.type === "admin" ? (
          <LinearGradient
            colors={["rgba(255,255,255,0.18)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.adminBadge}
          >
            <Text style={s.adminText}>ADMIN</Text>
          </LinearGradient>
        ) : profile.type === "teacher" ? (
          <LinearGradient
            colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0.06)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.teacherBadge}
          >
            <Feather
              name="award"
              size={12}
              color="#FFFFFF"
              style={{ marginRight: 4 }}
            />
            <Text style={s.adminText}>TEACHER</Text>
          </LinearGradient>
        ) : null}
        <Pressable
          onPress={() => router.push("/settings")}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          style={[s.settings, { backgroundColor: themeColors.dark }]}
        >
          <Feather name="settings" size={20} color={themeColors.white} />
        </Pressable>
      </View>
      <View style={[s.sheet, { backgroundColor: themeColors.white }]}>
        <View
          style={[
            s.avatarWrap,
            { backgroundColor: themeColors.white },
            { borderColor: accentColor },
            {
              width: avatarSize,
              height: avatarSize,
              marginTop: -avatarSize * 0.47,
            },
          ]}
        >
          <FirebaseImage
            source={requestedUri ? { uri: requestedUri } : undefined}
            fallbackSource={fallbackAvatar}
            placeholder={fallbackAvatar}
            style={s.avatar}
            contentFit="cover"
            accessibilityLabel="User profile picture"
          />
        </View>
        <Text style={[s.name, { color: themeColors.text }]}>
          {profile.name}
        </Text>
        {profile.bio ? (
          <Text style={[s.bio, { color: themeColors.subtitle }]}>
            {profile.bio}
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add your bio"
            hitSlop={8}
            onPress={() => router.push("/my-profile")}
          >
            <Text style={[s.addBio, { color: themeColors.primary }]}>
              ✎ Talk about yourself
            </Text>
          </Pressable>
        )}

        {profile.type === "teacher" && (
          <Pressable
            onPress={() => {
              router.push({
                pathname: "/teacher-profile",
                params: {
                  name: profile.name,
                  openedFromAccount: "true",
                },
              } as any);
            }}
            style={[
              s.publicProfileButton,
              { borderColor: themeColors.primary },
            ]}
            accessibilityRole="button"
            accessibilityLabel="View public teacher profile"
          >
            <Feather
              name="external-link"
              size={14}
              color={themeColors.primary}
            />
            <Text
              style={[
                s.publicProfileButtonText,
                { color: themeColors.primary },
              ]}
            >
              View Public Channel & Resources
            </Text>
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
  teacherBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderBottomRightRadius: 14,
    backgroundColor: "rgba(0,0,0,0.2)",
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
    paddingBottom: 20,
    minHeight: 130,
  },
  avatarWrap: {
    borderRadius: 999,
    marginBottom: 10,
    borderWidth: 5,
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
  publicProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    backgroundColor: "transparent",
  },
  publicProfileButtonText: {
    fontSize: 13,
    fontWeight: "700",
  },
});
