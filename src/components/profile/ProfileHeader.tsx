import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
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

  const roleTitle =
    profile.type === "admin"
      ? "Administrator"
      : profile.type === "teacher"
        ? "Verified Educator"
        : "Student Learner";

  const roleIcon: ComponentProps<typeof Feather>["name"] =
    profile.type === "admin"
      ? "shield"
      : profile.type === "teacher"
        ? "award"
        : "book-open";

  const isHexAccent = /^#([A-Fa-f0-9]{6})$/.test(accentColor);
  const accentMid = isHexAccent ? `${accentColor}B3` : accentColor;
  const accentDark = isDark ? "#0A0F1D" : "#111827";

  return (
    <View style={[s.wrap, { backgroundColor: themeColors.white }]}>
      {/* Banner Header with Gradient & Decorative Elements */}
      <LinearGradient
        colors={[accentColor, accentMid, accentDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.banner}
      >
        {/* Subtle Decorative Background Accents */}
        <View style={s.bgCircle1} />
        <View style={s.bgCircle2} />

        {/* Role Badge on Banner */}
        {profile.type === "admin" ? (
          <LinearGradient
            colors={["rgba(239,68,68,0.85)", "rgba(185,28,28,0.7)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.bannerRoleBadge}
          >
            <Feather name="shield" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={s.bannerRoleText}>ADMIN</Text>
          </LinearGradient>
        ) : profile.type === "teacher" ? (
          <LinearGradient
            colors={["rgba(16,185,129,0.85)", "rgba(5,150,105,0.7)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.bannerRoleBadge}
          >
            <Feather name="award" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={s.bannerRoleText}>TEACHER</Text>
          </LinearGradient>
        ) : null}

        {/* Settings Button */}
        <Pressable
          onPress={() => router.push("/settings")}
          accessibilityRole="button"
          accessibilityLabel="Open settings"
          style={({ pressed }) => [
            s.settingsBtn,
            pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
          ]}
        >
          <Feather name="settings" size={18} color="#FFFFFF" />
        </Pressable>
      </LinearGradient>

      {/* Main Sheet & Identity */}
      <View style={[s.sheet, { backgroundColor: themeColors.white }]}>
        <View style={s.avatarContainer}>
          <Pressable
            onPress={() => router.push("/my-profile")}
            accessibilityRole="button"
            accessibilityLabel="Edit profile picture"
            style={({ pressed }) => [
              s.avatarWrap,
              { backgroundColor: themeColors.white, borderColor: accentColor },
              {
                width: avatarSize,
                height: avatarSize,
                marginTop: -avatarSize * 0.5,
              },
              pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
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
            {/* Edit overlay icon */}
            <View style={[s.editAvatarBadge, { backgroundColor: themeColors.primary }]}>
              <Feather name="camera" size={12} color="#FFFFFF" />
            </View>
          </Pressable>
        </View>

        {/* User Name */}
        <Text style={[s.name, { color: themeColors.text }]}>
          {profile.name}
        </Text>

        {/* Role Pill */}
        <View style={[s.roleChip, { backgroundColor: themeColors.lightBackground, borderColor: themeColors.border }]}>
          <Feather name={roleIcon} size={13} color={themeColors.primary} />
          <Text style={[s.roleChipText, { color: themeColors.text }]}>
            {roleTitle}
          </Text>
        </View>

        {/* Bio Text */}
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
              ✎ Add a short bio about yourself
            </Text>
          </Pressable>
        )}

        {/* Header Action Buttons */}
        <View style={s.actionRow}>
          <Pressable
            onPress={() => router.push("/my-profile")}
            style={({ pressed }) => [
              s.editProfileButton,
              { backgroundColor: themeColors.surface, borderColor: themeColors.border },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Edit profile details"
          >
            <Feather name="edit-3" size={14} color={themeColors.text} />
            <Text style={[s.editProfileButtonText, { color: themeColors.text }]}>
              Edit Profile
            </Text>
          </Pressable>

          {profile.type === "teacher" && (
            <Pressable
              onPress={() => {
                router.push({
                  pathname: "/(tabs)/teacher-profile",
                  params: { name: profile.name },
                } as any);
              }}
              style={({ pressed }) => [
                s.publicProfileButton,
                { backgroundColor: themeColors.primary },
                pressed && { opacity: 0.9, transform: [{ scale: 0.98 }] },
              ]}
              accessibilityRole="button"
              accessibilityLabel="View public teacher profile"
            >
              <Feather name="external-link" size={14} color="#FFFFFF" />
              <Text style={s.publicProfileButtonText}>
                Public Channel
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: {
    width: "100%",
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  banner: {
    height: 140,
    position: "relative",
    overflow: "hidden",
    justifyContent: "space-between",
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  bgCircle1: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  bgCircle2: {
    position: "absolute",
    bottom: -40,
    left: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  bannerRoleBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  bannerRoleText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  settingsBtn: {
    position: "absolute",
    right: 14,
    top: 12,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  sheet: {
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 18,
  },
  avatarContainer: {
    position: "relative",
    alignItems: "center",
  },
  avatarWrap: {
    borderRadius: 999,
    marginBottom: 8,
    borderWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  avatar: { width: "100%", height: "100%", borderRadius: 999 },
  editAvatarBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  name: {
    fontSize: 23,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.3,
  },
  roleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
  },
  roleChipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bio: {
    color: colors.subtitle,
    lineHeight: 20,
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  addBio: {
    color: colors.primary,
    fontSize: 13,
    marginTop: 8,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginTop: 16,
    flexWrap: "wrap",
  },
  editProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    borderWidth: 1,
  },
  editProfileButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
  publicProfileButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
  },
  publicProfileButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});
