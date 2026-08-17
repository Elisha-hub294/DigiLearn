import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { InterestsCarousel } from "../components/profile/InterestsCarousel";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { SavedResources } from "../components/profile/SavedResources";
import { UserInfoCard } from "../components/profile/UserInfoCard";
import { colors, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
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
          <SavedResources profile={null} signedIn={false} />
        ) : profile ? (
          <Animated.View entering={FadeIn.duration(220)} style={s.sections}>
            <ProfileHeader profile={profile} photoURL={user.photoURL} />
            <UserInfoCard profile={profile} />
            <InterestsCarousel subjects={profile.subjects} />
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
  guestContent: { flexGrow: 1, justifyContent: "center" },
  sections: { gap: 20 },
  skeleton: { gap: 20 },
  skeletonHero: { height: 280, borderRadius: 24, backgroundColor: "#EDF2F8" },
  skeletonBlock: { height: 130, borderRadius: 18, backgroundColor: "#EDF2F8" },
  error: { padding: 28, alignItems: "center" },
  errorTitle: { color: colors.dark, fontWeight: "700", fontSize: 17 },
  errorCopy: { color: colors.subtitle, marginTop: 8, textAlign: "center" },
});
