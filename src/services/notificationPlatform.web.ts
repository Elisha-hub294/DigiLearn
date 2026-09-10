export const AndroidImportance = { DEFAULT: 3 } as const;
export const IosAuthorizationStatus = { PROVISIONAL: "provisional" } as const;
export const SchedulableTriggerInputTypes = {
  TIME_INTERVAL: "timeInterval",
  DAILY: "daily",
} as const;

export async function getPermissionsAsync() {
  return { granted: false, ios: undefined };
}

export async function requestPermissionsAsync() {
  return { granted: false, ios: undefined };
}

export async function setNotificationChannelAsync() {}

export async function getDevicePushTokenAsync(): Promise<never> {
  throw new Error("Push notifications are unavailable on web.");
}

export async function cancelScheduledNotificationAsync() {}

export async function scheduleNotificationAsync(): Promise<never> {
  throw new Error("Scheduled notifications are unavailable on web.");
}

export async function getAllScheduledNotificationsAsync() {
  return [];
}
