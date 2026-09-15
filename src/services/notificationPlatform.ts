import Constants from "expo-constants";
import { Platform } from "react-native";

type NotificationsModule = typeof import("expo-notifications");

const isExpoGoAndroid =
  Platform.OS === "android" &&
  (Constants.appOwnership === "expo" ||
    Constants.executionEnvironment === "storeClient");

let notificationsPromise: Promise<NotificationsModule | null> | undefined;

function getNotifications(): Promise<NotificationsModule | null> {
  if (isExpoGoAndroid) return Promise.resolve(null);

  notificationsPromise ??= import("expo-notifications").then(
    (Notifications) => {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      return Notifications;
    },
  );

  return notificationsPromise;
}

export const AndroidImportance = { DEFAULT: 3 } as const;
export const IosAuthorizationStatus = {
  PROVISIONAL:
    "provisional" as unknown as NotificationsModule["IosAuthorizationStatus"]["PROVISIONAL"],
};
export const SchedulableTriggerInputTypes = {
  TIME_INTERVAL:
    "timeInterval" as NotificationsModule["SchedulableTriggerInputTypes"]["TIME_INTERVAL"],
} as const;

export async function getPermissionsAsync() {
  const Notifications = await getNotifications();
  return (
    Notifications?.getPermissionsAsync() ?? { granted: false, ios: undefined }
  );
}

export async function requestPermissionsAsync() {
  const Notifications = await getNotifications();
  return (
    Notifications?.requestPermissionsAsync() ?? {
      granted: false,
      ios: undefined,
    }
  );
}

export async function setNotificationChannelAsync(
  ...args: Parameters<NotificationsModule["setNotificationChannelAsync"]>
) {
  const Notifications = await getNotifications();
  if (Notifications) return Notifications.setNotificationChannelAsync(...args);
  return null;
}

export async function getDevicePushTokenAsync() {
  const Notifications = await getNotifications();
  if (!Notifications)
    throw new Error(
      "Push notifications are unavailable in Expo Go on Android.",
    );
  return Notifications.getDevicePushTokenAsync();
}

export async function cancelScheduledNotificationAsync(identifier: string) {
  const Notifications = await getNotifications();
  if (Notifications)
    return Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function scheduleNotificationAsync(
  ...args: Parameters<NotificationsModule["scheduleNotificationAsync"]>
) {
  const Notifications = await getNotifications();
  if (!Notifications)
    throw new Error(
      "Scheduled notifications are unavailable in Expo Go on Android.",
    );
  return Notifications.scheduleNotificationAsync(...args);
}

export async function getAllScheduledNotificationsAsync() {
  const Notifications = await getNotifications();
  return Notifications?.getAllScheduledNotificationsAsync() ?? [];
}
