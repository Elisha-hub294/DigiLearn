import { Feather as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { auth } from "../../../firebaseConfig";
import { colors, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";
import { useLiveSession } from "../../hooks/useLiveSession";
import { useNotifications } from "../../hooks/useNotifications";
import { NotificationType } from "../../services/notifications";
import { openGoogleMeetSession } from "../../utils/googleMeet";

// ---------------------------------------------------------------------------
// Animated Live Join Button
// ---------------------------------------------------------------------------

const LIVE_RED = "#E53935";
const LIVE_RED_DEEP = "#B71C1C";

function LiveJoinButton({ meetCode, meetUrl }: { meetCode?: string; meetUrl?: string }) {
  // Scale pulse: the button breathes in/out subtly
  const scale = useSharedValue(1);
  // Glow ring opacity: ripple-out effect
  const ringOpacity = useSharedValue(0.7);
  const ringScale = useSharedValue(1);

  useEffect(() => {
    // Button heartbeat
    scale.value = withRepeat(
      withSequence(
        withTiming(1.04, { duration: 700, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 700, easing: Easing.in(Easing.quad) }),
      ),
      -1,
      false,
    );

    // Ripple ring expands and fades continuously
    ringScale.value = withRepeat(
      withTiming(1.9, { duration: 1400, easing: Easing.out(Easing.quad) }),
      -1,
      false,
    );
    ringOpacity.value = withRepeat(
      withSequence(
        withTiming(0.6, { duration: 200 }),
        withTiming(0, { duration: 1200, easing: Easing.out(Easing.cubic) }),
      ),
      -1,
      false,
    );
  }, []);

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: ringOpacity.value,
    transform: [{ scale: ringScale.value }],
  }));

  const handlePress = async () => {
    const target = meetUrl || meetCode;
    if (!target) return;
    await openGoogleMeetSession(target);
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Join the live class session on Google Meet"
      onPress={handlePress}
      style={styles.liveButtonOuter}
    >
      {/* Pulsating glow ring */}
      <Animated.View style={[styles.liveGlowRing, ringStyle]} />

      {/* Animated button body */}
      <Animated.View style={[styles.liveButtonBody, buttonStyle]}>
        <LinearGradient
          colors={[LIVE_RED, LIVE_RED_DEEP]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.liveGradient}
        >
          {/* Pulsing red dot indicator */}
          <View style={styles.liveDotWrap}>
            <View style={styles.liveDot} />
          </View>
          <Text style={styles.liveButtonText}>Join Live</Text>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Header
// ---------------------------------------------------------------------------

type HeaderProps = {
  title?: string;
  rightIconName?: string;
  showBadge?: boolean;
  showPublishButton?: boolean;
  showDownloadsButton?: boolean;
  notificationTypes?: readonly NotificationType[];
};

export const Header = ({
  title,
  rightIconName = "bell",
  showBadge = true,
  showPublishButton = false,
  showDownloadsButton = false,
  notificationTypes,
}: HeaderProps) => {
  const { width } = useWindowDimensions();
  const { notifications } = useNotifications();
  const { profile } = useProfile();
  const { colors, isDark } = useTheme();

  const liveSession = useLiveSession();

  // Show the Join Live button only to students (not teachers / admins who started it).
  // We exclude teacher and admin rather than positively listing student types
  // to avoid TypeScript narrowing issues with the AccountType union.
  const isStudent =
    profile?.type !== "teacher" && profile?.type !== "admin";
  const showLiveButton = isStudent && liveSession !== null;


  const canPublish =
    showPublishButton &&
    (profile?.type === "teacher" || profile?.type === "admin");
  const publishDisabled =
    profile?.type === "teacher" && profile.teacherApprovalStatus !== "approved";
  const hasUnread = notifications.some(
    (notification) =>
      !notification.read &&
      (!notificationTypes?.length ||
        notificationTypes.includes(notification.type)),
  );

  // Scale greeting font: 22px on ~320px screens, up to 34px on ~430px+ screens
  const greetingFontSize = Math.min(
    34,
    Math.max(22, Math.round(width * 0.075)),
  );
  const [authUser, setAuthUser] = useState<User | null>(auth.currentUser);
  const [greeting, setGreeting] = useState("Hi there");

  const userName = getFirstName(
    authUser,
    profile?.name,
    profile?.type === "teacher",
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    setGreeting(generateGreeting());
  }, []);

  const date = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  const isLibraryVariant = Boolean(title);

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        {isLibraryVariant ? (
          <Text
            style={[
              styles.libraryTitle,
              { fontSize: greetingFontSize, color: colors.dark },
            ]}
          >
            {title}
          </Text>
        ) : (
          <>
            <Text style={[styles.date, { color: colors.subtitle }]}>
              {date}
            </Text>
            <Text
              style={[
                styles.greeting,
                { fontSize: greetingFontSize, color: colors.dark },
              ]}
            >
              {greeting}
              {userName ? (
                <Text style={{ color: colors.primary }}> {userName}</Text>
              ) : null}
            </Text>
          </>
        )}
      </View>

      <View style={styles.actions}>
        {/* ── Live Session CTA (students only) ─────────────────────── */}
        {showLiveButton && liveSession ? (
          <LiveJoinButton
            meetCode={liveSession.meetCode}
            meetUrl={liveSession.meetUrl}
          />
        ) : null}

        {/* ── Publish button (teachers / admins) ───────────────────── */}
        {canPublish ? (
          <Pressable
            accessibilityLabel="Publish content"
            disabled={publishDisabled}
            onPress={() => router.push("/publish" as any)}
            style={[
              styles.publishButton,
              publishDisabled && styles.publishDisabled,
            ]}
          >
            <Icon
              name="plus"
              size={18}
              color={isDark ? "#FFFFFF" : colors.white}
            />
          </Pressable>
        ) : null}

        {showDownloadsButton && (
          <Pressable
            style={styles.notificationButton}
            accessibilityLabel="Open offline downloads"
            onPress={() => router.push("/downloads" as any)}
          >
            <Icon name="download-cloud" size={20} color={colors.dark} />
          </Pressable>
        )}

        <Pressable
          style={styles.notificationButton}
          accessibilityLabel="Open notifications"
          onPress={() =>
            router.push({
              pathname: "/notifications",
              params: notificationTypes?.length
                ? { types: notificationTypes.join(",") }
                : undefined,
            } as any)
          }
        >
          <Icon name={rightIconName as any} size={22} color={colors.dark} />
          {showBadge && hasUnread ? <View style={styles.badge} /> : null}
        </Pressable>
      </View>
    </View>
  );
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFirstName(
  user: User | null,
  profileName: string | undefined,
  isTeacher: boolean,
) {
  if (!user) return null;
  const name = profileName?.trim() || user.displayName?.trim();
  if (!name) return null;

  const nameParts = name.split(/\s+/);
  const firstName = nameParts[0];
  const normalizedFirstName = firstName.toLowerCase().replace(/[.\s]/g, "");
  const teacherLabelNames = new Set([
    "teacher",
    "teach",
    "tr",
    "tchr",
    "tutor",
    "educator",
    "instructor",
  ]);
  const displayName =
    isTeacher && teacherLabelNames.has(normalizedFirstName) && nameParts[1]
      ? nameParts[1]
      : firstName;

  return isTeacher ? `Tr. ${displayName}` : displayName;
}

function generateGreeting() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    if (hour < 12) return "Happy weekend";
    if (hour < 18) return "Enjoy your weekend";
    return "Happy weekend";
  }

  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good evening";
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  textWrap: { flex: 1, minWidth: 0, paddingRight: spacing.md },
  date: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  greeting: {
    color: colors.dark,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  libraryTitle: {
    color: colors.dark,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
    gap: 10,
  },

  // ── Live button ──────────────────────────────────────────────────────────
  liveButtonOuter: {
    alignItems: "center",
    justifyContent: "center",
    // extra space so the glow ring isn't clipped
    width: 88,
    height: 40,
  },
  liveGlowRing: {
    position: "absolute",
    width: 80,
    height: 34,
    borderRadius: 17,
    backgroundColor: LIVE_RED,
    // not using boxShadow for the ring itself – rely on opacity+scale animation
  },
  liveButtonBody: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 6,
    // iOS shadow
    shadowColor: LIVE_RED,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
  },
  liveGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
    paddingVertical: 7,
    gap: 5,
    borderRadius: 20,
  },
  liveDotWrap: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#FFFFFF",
  },
  liveButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // ── Publish button ───────────────────────────────────────────────────────
  publishButton: {
    width: 42,
    height: 42,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
    boxShadow: `0px 6px 10px ${colors.primary}40`,
    elevation: 4,
  },
  publishDisabled: {
    backgroundColor: colors.inactive,
    boxShadow: "none",
    elevation: 0,
  },

  // ── Icon buttons ─────────────────────────────────────────────────────────
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    borderColor: colors.border,
    borderWidth: 1,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 11,
    height: 11,
    borderRadius: 4.5,
    backgroundColor: "#ff0000",
    borderWidth: 2,
    borderColor: colors.white,
  },
});
