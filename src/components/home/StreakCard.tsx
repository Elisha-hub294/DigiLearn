import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { radius, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";
import { getStreakData, StreakData } from "../../services/streakService";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function StreakCard() {
  const { colors, isDark } = useTheme();
  const [streak, setStreak] = useState<StreakData | null>(null);

  const loadStreak = useCallback(async () => {
    const data = await getStreakData();
    setStreak(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadStreak();
    }, [loadStreak]),
  );

  if (!streak) return null;

  // Determine current day of week (0 = Sun, 1 = Mon... 6 = Sat)
  const now = new Date();
  const currentDayOfWeek = (now.getDay() + 6) % 7; // Convert to Mon = 0 ... Sun = 6

  // Check if today was studied
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const isStudiedToday = streak.lastActiveDate === todayStr;

  return (
    <Animated.View
      entering={FadeInUp.duration(400)}
      style={[
        styles.card,
        {
          backgroundColor: isDark ? "#1E293B" : "#FFF7ED",
          borderColor: isDark ? "#334155" : "#FED7AA",
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.badgeRow}>
          <View style={[styles.fireCircle, { backgroundColor: isDark ? "#431407" : "#FFEDD5" }]}>
            <Text style={styles.fireEmoji}>🔥</Text>
          </View>
          <View>
            <View style={styles.streakTitleRow}>
              <Text style={[styles.streakCount, { color: isDark ? "#F97316" : "#EA580C" }]}>
                {streak.currentStreak}
              </Text>
              <Text style={[styles.streakLabel, { color: colors.text }]}>
                {streak.currentStreak === 1 ? "Day Streak" : "Days Streak"}
              </Text>
            </View>
            <Text style={[styles.subLabel, { color: colors.subtitle }]}>
              {isStudiedToday
                ? "You've studied today! Great consistency."
                : "Open a lesson or book today to keep it going!"}
            </Text>
          </View>
        </View>

        {streak.longestStreak > 0 && (
          <View style={[styles.bestPill, { backgroundColor: isDark ? "#0F172A" : "#FFFFFF" }]}>
            <Feather name="award" size={12} color="#F59E0B" />
            <Text style={[styles.bestText, { color: colors.subtitle }]}>
              Best: {streak.longestStreak}d
            </Text>
          </View>
        )}
      </View>

      {/* Week Day Dots */}
      <View style={styles.daysRow}>
        {DAYS.map((dayLetter, index) => {
          const isToday = index === currentDayOfWeek;
          // Rough approximation: if isToday and studied today, or within streak
          const daysAgo = currentDayOfWeek - index;
          const isActive =
            (isToday && isStudiedToday) ||
            (daysAgo > 0 && daysAgo < streak.currentStreak);

          return (
            <View key={index} style={styles.dayCol}>
              <Text
                style={[
                  styles.dayLetter,
                  {
                    color: isToday
                      ? isDark
                        ? "#F97316"
                        : "#EA580C"
                      : colors.subtitle,
                    fontWeight: isToday ? "700" : "500",
                  },
                ]}
              >
                {dayLetter}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  isActive
                    ? { backgroundColor: "#F97316" }
                    : {
                        backgroundColor: isDark ? "#334155" : "#E2E8F0",
                      },
                  isToday && !isActive && styles.todayPendingDot,
                ]}
              >
                {isActive && <Feather name="check" size={10} color="#FFFFFF" />}
              </View>
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    flex: 1,
  },
  fireCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  fireEmoji: {
    fontSize: 22,
  },
  streakTitleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  streakCount: {
    fontSize: 18,
    fontWeight: "800",
  },
  streakLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  subLabel: {
    fontSize: 12,
    marginTop: 1,
  },
  bestPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  bestText: {
    fontSize: 11,
    fontWeight: "600",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.xs,
    paddingTop: spacing.xs,
  },
  dayCol: {
    alignItems: "center",
    gap: 4,
  },
  dayLetter: {
    fontSize: 11,
  },
  dayDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  todayPendingDot: {
    borderWidth: 1.5,
    borderColor: "#F97316",
    borderStyle: "dashed",
  },
});
