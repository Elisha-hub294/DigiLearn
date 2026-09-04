import * as Haptics from "expo-haptics";
import { Platform, ToastAndroid } from "react-native";

export const feedbackMessages = {
  itemSaved: "Item saved",
  itemUnsaved: "Removed from saved items",
  itemHidden: "Item hidden successfully",
  itemRestored: "Item restored",
  revisionUpdated: "Revision status updated",
} as const;

export function showNativeToast(
  message: string,
  duration: "short" | "long" = "short",
) {
  if (Platform.OS !== "android") return false;

  void Haptics.selectionAsync();
  ToastAndroid.show(
    message,
    duration === "long" ? ToastAndroid.LONG : ToastAndroid.SHORT,
  );
  return true;
}
