import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig";

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // "YYYY-MM-DD"
  activeDates: string[]; // List of recent dates "YYYY-MM-DD" active (last 30 days)
  todayMinutes: number; // Estimated minutes active today
}

const STREAK_STORAGE_KEY = "@digilearn_user_streak";

function getTodayDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return getTodayDateString(yesterday);
}

const DEFAULT_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActiveDate: "",
  activeDates: [],
  todayMinutes: 0,
};

/**
 * Loads current streak data from AsyncStorage or Firestore.
 */
export async function getStreakData(): Promise<StreakData> {
  try {
    const cached = await AsyncStorage.getItem(STREAK_STORAGE_KEY);
    let streak: StreakData = cached ? JSON.parse(cached) : DEFAULT_STREAK;

    // Check if the streak broke (if last active was before yesterday)
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();

    if (
      streak.lastActiveDate &&
      streak.lastActiveDate !== today &&
      streak.lastActiveDate !== yesterday
    ) {
      // Streak broken, reset currentStreak to 0
      streak = {
        ...streak,
        currentStreak: 0,
        todayMinutes: 0,
      };
      await AsyncStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(streak));
    } else if (streak.lastActiveDate !== today) {
      // It's a new day, reset today's minutes
      streak.todayMinutes = 0;
    }

    return streak;
  } catch (err) {
    console.warn("Error getting streak data:", err);
    return DEFAULT_STREAK;
  }
}

/**
 * Records learning activity for today, updating consecutive streak.
 */
export async function recordStudyActivity(addedMinutes: number = 5): Promise<StreakData> {
  try {
    const today = getTodayDateString();
    const yesterday = getYesterdayDateString();
    let data = await getStreakData();

    const alreadyActiveToday = data.lastActiveDate === today;

    if (!alreadyActiveToday) {
      // If last active was yesterday, increment streak. Otherwise reset to 1.
      const isConsecutive = data.lastActiveDate === yesterday;
      const nextStreak = isConsecutive ? data.currentStreak + 1 : 1;
      const nextLongest = Math.max(data.longestStreak, nextStreak);

      const updatedActiveDates = [
        today,
        ...data.activeDates.filter((d) => d !== today),
      ].slice(0, 30);

      data = {
        currentStreak: nextStreak,
        longestStreak: nextLongest,
        lastActiveDate: today,
        activeDates: updatedActiveDates,
        todayMinutes: addedMinutes,
      };
    } else {
      // Already studied today, just increment minutes
      data.todayMinutes = (data.todayMinutes || 0) + addedMinutes;
    }

    await AsyncStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(data));

    // Schedule smart daily retention reminder based on current streak
    import("./pushNotificationService")
      .then(({ scheduleStreakReminder }) => scheduleStreakReminder(data.currentStreak))
      .catch(() => {});

    // Async sync to Firestore if user logged in
    const user = auth.currentUser;
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(
          userRef,
          {
            streak: {
              currentStreak: data.currentStreak,
              longestStreak: data.longestStreak,
              lastActiveDate: data.lastActiveDate,
              todayMinutes: data.todayMinutes,
            },
          },
          { merge: true },
        );
      } catch (cloudErr) {
        // Non-blocking sync failure
        console.warn("Could not sync streak to Firestore:", cloudErr);
      }
    }

    return data;
  } catch (error) {
    console.error("Failed to record study activity:", error);
    return DEFAULT_STREAK;
  }
}
