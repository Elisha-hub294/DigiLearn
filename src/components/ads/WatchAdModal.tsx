import { Feather } from "@expo/vector-icons";

import {
  RewardedAd,
  RewardedAdEventType,
} from "react-native-google-mobile-ads";
import { REWARDED_AD_UNIT_ID } from "../../constants/ads";

import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useState } from "react";
import {
  Animated,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { radius, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

// Create rewarded ad instance
const rewardedAd = RewardedAd.createForAdRequest(REWARDED_AD_UNIT_ID);

interface WatchAdModalProps {
  visible: boolean;
  resourceTitle?: string;
  onClose: () => void;
  onAdRewardEarned: () => void;
}

export function WatchAdModal({
  visible,
  resourceTitle,
  onClose,
  onAdRewardEarned,
}: WatchAdModalProps) {
  const { colors: themeColors } = useTheme();
  const [step, setStep] = useState<"prompt" | "playing">("prompt");
  const [countdown, setCountdown] = useState(5);
  const [adProgress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      setStep("prompt");
      setCountdown(5);
      adProgress.setValue(0);
    }
  }, [adProgress, visible]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (step === "playing") {
      Animated.timing(adProgress, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start();

      timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setTimeout(() => {
              onAdRewardEarned();
              onClose();
            }, 500);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [adProgress, onAdRewardEarned, onClose, step]);

  const handleStartAd = () => {
    setStep("playing");
    setCountdown(5);
    adProgress.setValue(0);

    // Listen for reward earned — fires when user completes the ad
    const unsubscribeEarned = rewardedAd.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        unsubscribeEarned();
        unsubscribeLoaded();
        setTimeout(() => {
          onAdRewardEarned();
          onClose();
        }, 500);
      },
    );

    // Load & show the ad once it's ready
    const unsubscribeLoaded = rewardedAd.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => {
        rewardedAd.show();
      },
    );

    rewardedAd.load();
  };

  if (!visible) return null;

  const progressWidth = adProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        {step === "prompt" ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: themeColors.white,
                borderColor: themeColors.border,
              },
            ]}
          >
            {/* Header Icon & Tag */}
            <View style={styles.headerIconContainer}>
              <LinearGradient
                colors={["#006eff", "#6C63FF", "#A855F7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconCircle}
              >
                <Feather name="tv" size={26} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={[styles.title, { color: themeColors.text }]}>
              Support OS platform
            </Text>

            {resourceTitle ? (
              <View
                style={[
                  styles.resourceBadge,
                  { backgroundColor: themeColors.lightBackground },
                ]}
              >
                <Feather
                  name="file-text"
                  size={13}
                  color={themeColors.primary}
                />
                <Text
                  style={[
                    styles.resourceTitleText,
                    { color: themeColors.primary },
                  ]}
                  numberOfLines={1}
                >
                  {resourceTitle}
                </Text>
              </View>
            ) : null}

            {/* Apology & Information Body */}
            <View style={styles.bodyContainer}>
              <Text
                style={[styles.apologyText, { color: themeColors.subtitle }]}
              >
                We apologize for interrupting your study session!
              </Text>
              <Text style={[styles.bodyText, { color: themeColors.text }]}>
                To support our platform and keep educational resources free and
                accessible for all students, downloading resources for offline
                use requires watching a short advertisement.
              </Text>
              <View
                style={[
                  styles.onlineNoteBox,
                  {
                    backgroundColor: themeColors.lightBackground,
                    borderColor: themeColors.border,
                  },
                ]}
              >
                <Feather
                  name="info"
                  size={16}
                  color={themeColors.primary}
                  style={styles.infoIcon}
                />
                <Text
                  style={[
                    styles.onlineNoteText,
                    { color: themeColors.subtitle },
                  ]}
                >
                  If you prefer no interruptions, you can continue reading this
                  resource online anytime right in the app!
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              {/* Primary Action: Watch Ad to Download */}
              <Pressable
                onPress={handleStartAd}
                style={({ pressed }) => [
                  styles.primaryBtn,
                  pressed && { opacity: 0.9 },
                ]}
              >
                <LinearGradient
                  colors={["#006eff", "#6C63FF", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.primaryGradient}
                >
                  <Feather name="play-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>
                    Watch Ad to Download
                  </Text>
                </LinearGradient>
              </Pressable>

              {/* Secondary Action: Read Online */}
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  {
                    backgroundColor: themeColors.lightBackground,
                    borderColor: themeColors.border,
                  },
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Feather name="book-open" size={16} color={themeColors.text} />
                <Text
                  style={[styles.secondaryBtnText, { color: themeColors.text }]}
                >
                  Read Online
                </Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* Playing Step - Rewarded Ad Player View */
          <View
            style={[
              styles.adPlayerCard,
              { backgroundColor: themeColors.white },
            ]}
          >
            {/* Top Bar */}
            <View style={styles.adHeader}>
              <View style={styles.adSponsorTag}>
                <Feather name="shield" size={12} color="#006eff" />
                <Text style={styles.adSponsorLabel}>Sponsored Message</Text>
              </View>

              <View style={styles.countdownBadge}>
                <Feather name="clock" size={12} color="#FFFFFF" />
                <Text style={styles.countdownText}>
                  {countdown > 0 ? `Reward in ${countdown}s` : "Reward Earned!"}
                </Text>
              </View>
            </View>

            {/* Ad Banner Content */}
            <LinearGradient
              colors={["#0f172a", "#1e1b4b", "#311042"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.adBannerArea}
            >
              <View style={styles.adContentInner}>
                <View style={styles.adLogoBadge}>
                  <Feather name="zap" size={24} color="#F59E0B" />
                </View>
                <Text style={styles.adTitle}>OS platform Sponsor</Text>
                <Text style={styles.adSubtitle}>
                  Empowering your learning journey everywhere you go.
                </Text>
              </View>
            </LinearGradient>

            {/* Ad Progress Bar */}
            <View
              style={[
                styles.adTrack,
                { backgroundColor: themeColors.lightBackground },
              ]}
            >
              <Animated.View style={[styles.adFill, { width: progressWidth }]}>
                <LinearGradient
                  colors={["#006eff", "#6C63FF", "#A855F7"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              </Animated.View>
            </View>

            <View style={styles.adFooter}>
              <Text
                style={[styles.adFooterText, { color: themeColors.subtitle }]}
              >
                {countdown > 0
                  ? "Please complete watching the ad to unlock your download..."
                  : "Thank you for supporting OS platform! Starting download..."}
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.65)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.md,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    ...Platform.select({
      ios: {
        boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.2)",
      },
      android: { elevation: 10 },
    }),
  },
  headerIconContainer: {
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    ...Platform.select({
      ios: {
        boxShadow: "0px 4px 12px rgba(108, 99, 255, 0.4)",
      },
      android: { elevation: 6 },
    }),
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    textAlign: "center",
    marginTop: spacing.xs,
  },
  resourceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
    maxWidth: "90%",
  },
  resourceTitleText: {
    fontSize: 12,
    fontWeight: "600",
  },
  bodyContainer: {
    width: "100%",
    marginVertical: spacing.sm,
    gap: spacing.sm,
  },
  apologyText: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    fontStyle: "italic",
  },
  bodyText: {
    fontSize: 13.5,
    lineHeight: 20,
    textAlign: "center",
  },
  onlineNoteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
    marginTop: 4,
  },
  infoIcon: {
    marginTop: 2,
  },
  onlineNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  actionContainer: {
    width: "100%",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryBtn: {
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  primaryGradient: {
    flexDirection: "row",
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: spacing.md,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryBtn: {
    flexDirection: "row",
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Playing / Rewarded Ad Player Styles
  adPlayerCard: {
    width: "100%",
    maxWidth: 420,
    borderRadius: radius.lg,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.3)",
      },
      android: { elevation: 12 },
    }),
  },
  adHeader: {
    height: 44,
    backgroundColor: "#090d16",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
  },
  adSponsorTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  adSponsorLabel: {
    color: "#94A3B8",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countdownBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  countdownText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  adBannerArea: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  adContentInner: {
    alignItems: "center",
    gap: 8,
  },
  adLogoBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  adTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  adSubtitle: {
    color: "#CBD5E1",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  adTrack: {
    height: 6,
    width: "100%",
  },
  adFill: {
    height: 6,
  },
  adFooter: {
    padding: spacing.md,
    alignItems: "center",
  },
  adFooterText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
});
