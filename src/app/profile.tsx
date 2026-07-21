import { useCallback, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { AboutCard } from "../components/profile/AboutCard";
import { InterestsCarousel } from "../components/profile/InterestsCarousel";
import { ProfileHeader } from "../components/profile/ProfileHeader";
import { ProfileStatsCard } from "../components/profile/ProfileStatsCard";
import { PublishButton } from "../components/profile/PublishButton";
import { SavedResources } from "../components/profile/SavedResources";
import { UserInfoCard } from "../components/profile/UserInfoCard";
import { colors, spacing } from "../constants/theme";

const Section = ({
  children,
  delay,
}: {
  children: React.ReactNode;
  delay: number;
}) => (
  <Animated.View
    entering={FadeInUp.delay(delay).duration(420).springify()}
    style={s.section}
  >
    {children}
  </Animated.View>
);

export default function ProfileScreen() {
  const { width } = useWindowDimensions();
  const [refreshing, setRefreshing] = useState(false);
  const padding =
    width >= 900 ? 32 : width >= 600 ? 28 : width >= 400 ? 20 : 16;
  const refresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 750);
  }, []);
  return (
    <SafeAreaView style={s.safe} edges={["top"]}>
      <Animated.View entering={FadeIn.duration(300)} style={s.page}>
        <ScrollView
          style={s.scroll}
          contentContainerStyle={[s.content, { paddingHorizontal: padding }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.primary}
              accessibilityLabel="Refresh profile"
            />
          }
        >
          <Section delay={40}>
            <ProfileHeader />
          </Section>
          <Section delay={220}>
            <UserInfoCard />
          </Section>
          <Section delay={100}>
            <PublishButton />
          </Section>
          <Section delay={160}>
            <ProfileStatsCard />
          </Section>
          <Section delay={280}>
            <AboutCard />
          </Section>
          <Section delay={340}>
            <InterestsCarousel />
          </Section>
          <Section delay={400}>
            <SavedResources />
          </Section>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, alignItems: "center", backgroundColor: colors.background },
  scroll: { flex: 1, width: "100%", maxWidth: 1000 },
  content: {
    width: "100%",
    alignSelf: "center",
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  section: { marginBottom: 20 },
});
