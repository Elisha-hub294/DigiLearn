import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
    Pressable,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { DownloadedResources } from "../../components/profile/DownloadedResources";
import { ProfileHeader } from "../../components/profile/ProfileHeader";
import { PublishButton } from "../../components/profile/PublishButton";
import { SavedResources } from "../../components/profile/SavedResources";
import { UserInfoCard } from "../../components/profile/UserInfoCard";
import { colors, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
const paddingFor = (width: number) =>
  width >= 1200
    ? 150
    : width >= 900
      ? 50
      : width >= 600
        ? 30
        : width >= 400
          ? 5
          : 3;
function Skeleton() {
  return (
    <View style={s.skeleton}>
      <View style={s.skeletonHero} />
      <View style={s.skeletonBlock} />
      <View style={s.skeletonBlock} />
      <View style={s.skeletonBlock} />
    </View>
  );
}
export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { user, profile, loading, error, refresh } = useProfile();
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);
  const padding = paddingFor(width);
  const maxWidth = Math.min(1100, width - padding * 2);
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <ScrollView
        contentContainerStyle={[
          s.content,
          !loading && !user && s.guestContent,
          { paddingHorizontal: padding, maxWidth },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            accessibilityLabel="Refresh profile"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <Skeleton />
        ) : !user ? (
          <View style={s.sections}>
            <DownloadedResources />
            <SavedResources profile={null} signedIn={false} />
          </View>
        ) : profile ? (
          <Animated.View entering={FadeIn.duration(220)} style={s.sections}>
            <ProfileHeader profile={profile} photoURL={user.photoURL} />
            {profile.teacherApprovalStatus === "pending" && (
              <View style={s.reviewBanner}>
                <Text style={s.reviewEyebrow}>
                  TEACHER ACCOUNT UNDER REVIEW
                </Text>
                <Text style={s.reviewText}>
                  Your account is ready to use in student mode while an admin
                  reviews your teacher application.
                </Text>
              </View>
            )}
            {profile.teacherApprovalStatus === "rejected" && (
              <View style={[s.reviewBanner, s.rejectedBanner]}>
                <Text style={s.rejectedEyebrow}>
                  TEACHER APPLICATION NEEDS UPDATES
                </Text>
                <Text style={s.reviewText}>
                  {profile.teacherReviewReason ||
                    "An admin requested changes before approval."}
                </Text>
                <Pressable
                  style={s.resubmitButton}
                  onPress={() =>
                    router.push("/teacher-account-quick-settings" as never)
                  }
                >
                  <Text style={s.resubmitText}>Update and resubmit</Text>
                </Pressable>
              </View>
            )}
            {profile.type === "admin" && (
              <>
                <PublishButton onPress={() => router.push("/publish")} />
                <Pressable
                  style={s.reviewLink}
                  onPress={() => router.push("/teacher-applications" as never)}
                >
                  <Text style={s.reviewLinkText}>
                    Review teacher applications
                  </Text>
                </Pressable>
              </>
            )}
            <UserInfoCard profile={profile} />
            <DownloadedResources />
            {/* <InterestsCarousel subjects={profile.subjects} /> */}
            <SavedResources profile={profile} signedIn />
          </Animated.View>
        ) : (
          <View style={s.error}>
            <Text style={s.errorTitle}>We couldn’t load your profile.</Text>
            <Text style={s.errorCopy}>
              {error ?? "Check your connection and pull to try again."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  content: {
    width: "100%",
    alignSelf: "center",
    paddingBottom: spacing.xxl,
  },
  rejectedBanner: { backgroundColor: "#FFF1F0", borderColor: "#F2B8B5" },
  rejectedEyebrow: {
    color: "#B42318",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  resubmitButton: {
    alignSelf: "flex-start",
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#B42318",
  },
  resubmitText: { color: colors.white, fontWeight: "700", fontSize: 13 },
  guestContent: { flexGrow: 1, justifyContent: "center" },
  sections: { gap: 20 },
  skeleton: { gap: 20 },
  skeletonHero: { height: 280, borderRadius: 24, backgroundColor: "#EDF2F8" },
  skeletonBlock: { height: 130, borderRadius: 18, backgroundColor: "#EDF2F8" },
  error: { padding: 28, alignItems: "center" },
  errorTitle: { color: colors.dark, fontWeight: "700", fontSize: 17 },
  errorCopy: { color: colors.subtitle, marginTop: 8, textAlign: "center" },
  reviewBanner: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 14,
    backgroundColor: "#FFF8E6",
    borderWidth: 1,
    borderColor: "#F2D48A",
  },
  reviewEyebrow: {
    color: "#946200",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.2,
  },
  reviewText: { color: "#6B4B00", fontSize: 13, lineHeight: 19, marginTop: 6 },
  reviewLink: {
    marginHorizontal: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  reviewLinkText: { color: colors.primary, fontWeight: "700" },
});
