import { useRouter } from "expo-router";
import { useNavigation, useRoute } from "expo-router/react-navigation";
import { useCallback, useEffect, useRef, useState } from "react";
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
import { Skeleton as UiSkeleton } from "../../components/ui/Skeleton";
import { colors, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useAdminReviewSignals } from "../../hooks/useAdminReviewSignals";
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
      <UiSkeleton style={s.skeletonHero} />
      <View style={s.skeletonIdentity}>
        <UiSkeleton style={s.skeletonAvatar} />
        <View style={s.skeletonIdentityCopy}>
          <UiSkeleton style={s.skeletonName} />
          <UiSkeleton style={s.skeletonBio} />
        </View>
      </View>
      <View style={s.skeletonResourceList}>
        {[0, 1, 2].map((item) => (
          <View key={item} style={s.skeletonResource}>
            <UiSkeleton style={s.skeletonResourceIcon} />
            <View style={s.skeletonResourceCopy}>
              <UiSkeleton style={s.skeletonResourceTitle} />
              <UiSkeleton style={s.skeletonResourceLine} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}
export default function ProfileScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const route = useRoute();
  const { width } = useWindowDimensions();
  const { user, profile, loading, error, refresh } = useProfile();
  const { newReportCount, pendingApplicationCount } = useAdminReviewSignals();
  const [refreshing, setRefreshing] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refresh();
    } finally {
      setRefreshing(false);
    }
  }, [refresh]);

  useEffect(() => {
    const addTabPressListener = navigation.addListener as unknown as (
      eventName: "tabPress",
      listener: (event: { target?: string }) => void,
    ) => () => void;

    return addTabPressListener("tabPress", (event) => {
      if (!navigation.isFocused() || event.target !== route.key) return;

      scrollRef.current?.scrollTo({ y: 0, animated: true });
      void onRefresh();
    });
  }, [navigation, onRefresh, route.key]);
  const padding = paddingFor(width);
  const maxWidth = Math.min(1100, width - padding * 2);
  return (
    <SafeAreaView
      style={[s.safe, { backgroundColor: themeColors.background }]}
      edges={["top"]}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          s.content,
          !loading && !user && s.guestContent,
          { paddingHorizontal: padding, maxWidth },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
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
              <View
                style={[
                  s.reviewBanner,
                  {
                    backgroundColor: themeColors.primaryLight,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text style={[s.reviewEyebrow, { color: themeColors.primary }]}>
                  TEACHER ACCOUNT UNDER REVIEW
                </Text>
                <Text style={[s.reviewText, { color: themeColors.text }]}>
                  DigiLearn is ready to use in student mode while we review your
                  teacher application.
                </Text>
              </View>
            )}
            {profile.teacherApprovalStatus === "rejected" && (
              <View
                style={[
                  s.reviewBanner,
                  s.rejectedBanner,
                  {
                    backgroundColor: themeColors.lightBackground,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Text
                  style={[s.rejectedEyebrow, { color: themeColors.primary }]}
                >
                  TEACHER APPLICATION NEEDS UPDATES
                </Text>
                <Text style={[s.reviewText, { color: themeColors.text }]}>
                  {profile.teacherReviewReason ||
                    "We requested changes before approval."}
                </Text>
                <Pressable
                  style={s.resubmitButton}
                  onPress={() =>
                    router.push("/teacher-account-quick-settings" as never)
                  }
                >
                  <Text style={[s.resubmitText, { color: themeColors.white }]}>
                    Update and resubmit
                  </Text>
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
                  <View style={s.reviewLinkContent}>
                    <Text
                      style={[s.reviewLinkText, { color: themeColors.primary }]}
                    >
                      Review teacher applications
                    </Text>
                    {pendingApplicationCount > 0 ? (
                      <View style={s.alertDot} />
                    ) : null}
                  </View>
                </Pressable>
                <Pressable
                  style={s.reviewLink}
                  onPress={() => router.push("/admin-reports" as never)}
                >
                  <View style={s.reviewLinkContent}>
                    <Text
                      style={[s.reviewLinkText, { color: themeColors.primary }]}
                    >
                      Review resource reports
                    </Text>
                    {newReportCount > 0 ? <View style={s.alertDot} /> : null}
                  </View>
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
            <Text style={[s.errorTitle, { color: themeColors.text }]}>
              We couldn’t load your profile.
            </Text>
            <Text style={[s.errorCopy, { color: themeColors.subtitle }]}>
              {error ?? "Check your connection and pull to try again."}
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    width: "100%",
    alignSelf: "center",
    paddingBottom: spacing.xxl,
  },
  rejectedBanner: {},
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
  skeletonHero: { height: 280, borderRadius: 24 },
  skeletonIdentity: { flexDirection: "row", alignItems: "center", gap: 14 },
  skeletonAvatar: { width: 64, height: 64, borderRadius: 32 },
  skeletonIdentityCopy: { flex: 1, gap: 9 },
  skeletonName: { width: "58%", height: 17 },
  skeletonBio: { width: "82%", height: 12 },
  skeletonResourceList: { gap: 12 },
  skeletonResource: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 76,
  },
  skeletonResourceIcon: { width: 52, height: 52, borderRadius: 12 },
  skeletonResourceCopy: { flex: 1, gap: 8 },
  skeletonResourceTitle: { width: "66%", height: 14 },
  skeletonResourceLine: { width: "44%", height: 11 },
  error: { padding: 28, alignItems: "center" },
  errorTitle: { fontWeight: "700", fontSize: 17 },
  errorCopy: { marginTop: 8, textAlign: "center" },
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
  reviewLinkContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  alertDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#DC2626",
  },
});
