import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, updateDoc } from "firebase/firestore";
import { Platform } from "react-native";
import { db } from "../../firebaseConfig";
import * as Notifications from "./notificationPlatform";
import type { NotificationProfileCollection } from "./notifications";

const PUSH_ENABLED_KEY = "digilearn.pushNotificationsEnabled";
const REMINDERS_ENABLED_KEY = "digilearn.remindersEnabled";
const REMINDER_ID_KEY = "digilearn.continueLearningReminderId";
const REMINDER_CHANNEL_ID = "learning-reminders";

export async function getPushNotificationSettings() {
  const [push, reminders] = await Promise.all([
    AsyncStorage.getItem(PUSH_ENABLED_KEY),
    AsyncStorage.getItem(REMINDERS_ENABLED_KEY),
  ]);

  return {
    pushEnabled: push !== "false",
    remindersEnabled: reminders !== "false",
  };
}

async function ensurePermission() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
      name: "Learning reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      sound: "default",
    });
  }

  const current = await Notifications.getPermissionsAsync();
  if (
    current.granted ||
    current.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  ) {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return (
    requested.granted ||
    requested.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
  );
}

export async function registerDeviceForPushNotifications(
  userId: string,
  collectionName: NotificationProfileCollection = "users",
) {
  if (!userId || Platform.OS === "web") return false;
  if (!(await ensurePermission())) return false;

  const token = await Notifications.getDevicePushTokenAsync();
  await updateDoc(doc(db, collectionName, userId), {
    [`pushTokens.${token.type}`]: token.data,
  });
  return true;
}

async function cancelReminder() {
  const reminderId = await AsyncStorage.getItem(REMINDER_ID_KEY);
  if (reminderId) {
    await Notifications.cancelScheduledNotificationAsync(reminderId);
    await AsyncStorage.removeItem(REMINDER_ID_KEY);
  }
}

export async function setPushNotificationsEnabled(
  userId: string | undefined,
  enabled: boolean,
  collectionName: NotificationProfileCollection = "users",
) {
  await AsyncStorage.setItem(PUSH_ENABLED_KEY, String(enabled));
  if (enabled && userId) {
    await registerDeviceForPushNotifications(userId, collectionName);
  }
  if (userId) {
    await updateDoc(doc(db, collectionName, userId), {
      pushNotificationsEnabled: enabled,
    });
  }
}

export async function setRemindersEnabled(enabled: boolean) {
  await AsyncStorage.setItem(REMINDERS_ENABLED_KEY, String(enabled));
  await cancelReminder();
  if (!enabled || Platform.OS === "web" || !(await ensurePermission())) return;

  const reminderId = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Keep learning with OS platform",
      body: "Continue reading one of your recently opened resources.",
      data: { type: "learning-reminder" },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 60 * 24,
      repeats: true,
      channelId: REMINDER_CHANNEL_ID,
    },
  });
  await AsyncStorage.setItem(REMINDER_ID_KEY, reminderId);
}
