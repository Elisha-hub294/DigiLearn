import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRewardedAd } from "react-native-google-mobile-ads";
import { REWARDED_AD_UNIT_ID } from "../../constants/ads";
import { radius, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

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

  const {
    isLoaded,
    isClosed,
    error,
    isEarnedReward,
    isShowing,
    load,
    show,
  } = useRewardedAd(REWARDED_AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
  });

  const [isWaitingForAd, setIsWaitingForAd] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [closedEarlyNotice, setClosedEarlyNotice] = useState(false);
  const hasRewardBeenClaimed = useRef(false);

  // Preload ad on mount or when modal becomes visible
  useEffect(() => {
    if (visible) {
      setErrorMessage(null);
      setClosedEarlyNotice(false);
      setIsWaitingForAd(false);
      hasRewardBeenClaimed.current = false;

      if (!isLoaded && !isShowing) {
        load();
      }
    }
  }, [visible, isLoaded, isShowing, load]);

  // If user tapped watch ad while it was loading, show as soon as loaded
  useEffect(() => {
    if (isWaitingForAd && isLoaded && !isShowing) {
      setIsWaitingForAd(false);
      try {
        show();
      } catch (err) {
        console.warn("[WatchAdModal] Error showing rewarded ad:", err);
        setErrorMessage("Could not launch advertisement. You can continue downloading directly.");
      }
    }
  }, [isWaitingForAd, isLoaded, isShowing, show]);

  // Handle ad load / presentation errors
  useEffect(() => {
    if (error && visible) {
      setIsWaitingForAd(false);
      if (__DEV__) {
        console.warn("[WatchAdModal] Ad error:", error);
      }
      setErrorMessage("Advertisement unavailable at the moment. You can still download this resource directly.");
    }
  }, [error, visible]);

  // Handle earned reward and ad closure
  useEffect(() => {
    if (!visible) return;

    if (isEarnedReward && !hasRewardBeenClaimed.current) {
      hasRewardBeenClaimed.current = true;
      const timer = setTimeout(() => {
        onAdRewardEarned();
        onClose();
      }, 500);
      return () => clearTimeout(timer);
    }

    if (isClosed && !hasRewardBeenClaimed.current && !isShowing) {
      setClosedEarlyNotice(true);
      setIsWaitingForAd(false);
      // Reload for next attempt
      load();
    }
  }, [isEarnedReward, isClosed, isShowing, visible, onAdRewardEarned, onClose, load]);

  const handleStartAd = () => {
    setClosedEarlyNotice(false);
    setErrorMessage(null);

    if (isLoaded) {
      try {
        show();
      } catch (err) {
        console.warn("[WatchAdModal] Failed to show ad:", err);
        setErrorMessage("Unable to display ad. You can proceed with direct download.");
      }
    } else {
      setIsWaitingForAd(true);
      load();

      // Timeout fallback: if ad fails to load within 8s, allow direct download
      setTimeout(() => {
        setIsWaitingForAd((current) => {
          if (current) {
            setErrorMessage("Ad loading took longer than expected. You can download directly.");
            return false;
          }
          return false;
        });
      }, 8000);
    }
  };

  const handleBypassDownload = () => {
    onAdRewardEarned();
    onClose();
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible && !isShowing}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: themeColors.white,
              borderColor: themeColors.border,
            },
          ]}
        >
          {/* Header Icon */}
          <View style={styles.headerIconContainer}>
            <LinearGradient
              colors={
                hasRewardBeenClaimed.current
                  ? ["#10B981", "#059669"]
                  : errorMessage
                  ? ["#F59E0B", "#D97706"]
                  : ["#006eff", "#6C63FF", "#A855F7"]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Feather
                name={
                  hasRewardBeenClaimed.current
                    ? "check"
                    : errorMessage
                    ? "alert-circle"
                    : "tv"
                }
                size={26}
                color="#FFFFFF"
              />
            </LinearGradient>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: themeColors.text }]}>
            {hasRewardBeenClaimed.current
              ? "Download Unlocked!"
              : errorMessage
              ? "Ad Notice"
              : "Support Free Education"}
          </Text>

          {/* Resource Title Badge */}
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

          {/* Body Content */}
          <View style={styles.bodyContainer}>
            {hasRewardBeenClaimed.current ? (
              <Text style={[styles.bodyText, { color: themeColors.text }]}>
                Thank you for watching! Your document download is starting now...
              </Text>
            ) : errorMessage ? (
              <View
                style={[
                  styles.noticeBox,
                  {
                    backgroundColor: "#FEF3C7",
                    borderColor: "#FCD34D",
                  },
                ]}
              >
                <Feather name="info" size={16} color="#D97706" style={styles.infoIcon} />
                <Text style={[styles.noticeText, { color: "#92400E" }]}>
                  {errorMessage}
                </Text>
              </View>
            ) : closedEarlyNotice ? (
              <View
                style={[
                  styles.noticeBox,
                  {
                    backgroundColor: "#FEF2F2",
                    borderColor: "#FECACA",
                  },
                ]}
              >
                <Feather name="alert-triangle" size={16} color="#DC2626" style={styles.infoIcon} />
                <Text style={[styles.noticeText, { color: "#991B1B" }]}>
                  The ad was closed before completion. Please watch the full ad to unlock your offline download.
                </Text>
              </View>
            ) : (
              <>
                <Text
                  style={[styles.apologyText, { color: themeColors.subtitle }]}
                >
                  Help keep learning materials accessible to all!
                </Text>
                <Text style={[styles.bodyText, { color: themeColors.text }]}>
                  To support our platform and keep educational resources completely free, downloading for offline study requires watching a short video sponsor.
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
                    name="book-open"
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
                    You can also continue reading online without downloading anytime!
                  </Text>
                </View>
              </>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionContainer}>
            {hasRewardBeenClaimed.current ? (
              <View style={styles.rewardSuccessIndicator}>
                <ActivityIndicator size="small" color={themeColors.primary} />
                <Text style={[styles.rewardSuccessText, { color: themeColors.primary }]}>
                  Preparing your file...
                </Text>
              </View>
            ) : errorMessage ? (
              <>
                <Pressable
                  onPress={handleBypassDownload}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    pressed && { opacity: 0.9 },
                  ]}
                >
                  <LinearGradient
                    colors={["#006eff", "#6C63FF"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradient}
                  >
                    <Feather name="download" size={18} color="#FFFFFF" />
                    <Text style={styles.primaryBtnText}>
                      Download Directly
                    </Text>
                  </LinearGradient>
                </Pressable>

                <Pressable
                  onPress={handleStartAd}
                  style={({ pressed }) => [
                    styles.secondaryBtn,
                    {
                      backgroundColor: themeColors.lightBackground,
                      borderColor: themeColors.border,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Feather name="refresh-cw" size={16} color={themeColors.text} />
                  <Text style={[styles.secondaryBtnText, { color: themeColors.text }]}>
                    Try Loading Ad Again
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                {/* Primary Action: Watch Ad */}
                <Pressable
                  onPress={handleStartAd}
                  disabled={isWaitingForAd}
                  style={({ pressed }) => [
                    styles.primaryBtn,
                    (pressed || isWaitingForAd) && { opacity: 0.85 },
                  ]}
                >
                  <LinearGradient
                    colors={["#006eff", "#6C63FF", "#A855F7"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryGradient}
                  >
                    {isWaitingForAd ? (
                      <>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.primaryBtnText}>
                          Loading Sponsor Ad...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Feather name="play-circle" size={18} color="#FFFFFF" />
                        <Text style={styles.primaryBtnText}>
                          {isLoaded ? "Watch Ad to Download" : "Load Ad & Download"}
                        </Text>
                      </>
                    )}
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
              </>
            )}
          </View>
        </View>
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
  noticeBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 8,
    marginVertical: 4,
  },
  noticeText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "500",
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
  rewardSuccessIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: spacing.md,
  },
  rewardSuccessText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
