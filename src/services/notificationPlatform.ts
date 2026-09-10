import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export const AndroidImportance = Notifications.AndroidImportance;
export const IosAuthorizationStatus = Notifications.IosAuthorizationStatus;
export const SchedulableTriggerInputTypes =
  Notifications.SchedulableTriggerInputTypes;

export const getPermissionsAsync = Notifications.getPermissionsAsync;
export const requestPermissionsAsync = Notifications.requestPermissionsAsync;
export const setNotificationChannelAsync =
  Notifications.setNotificationChannelAsync;
export const getDevicePushTokenAsync = Notifications.getDevicePushTokenAsync;
export const cancelScheduledNotificationAsync =
  Notifications.cancelScheduledNotificationAsync;
export const scheduleNotificationAsync =
  Notifications.scheduleNotificationAsync;
export const getAllScheduledNotificationsAsync =
  Notifications.getAllScheduledNotificationsAsync;
