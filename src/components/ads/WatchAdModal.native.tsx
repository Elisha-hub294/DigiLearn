import Constants from "expo-constants";
import { useEffect } from "react";
import { NativeModules } from "react-native";

interface WatchAdModalProps {
  visible: boolean;
  resourceTitle?: string;
  onClose: () => void;
  onAdRewardEarned: () => void;
}

const isExpoGo =
  Constants.appOwnership === "expo" ||
  Constants.executionEnvironment === "storeClient";
const canUseGoogleMobileAds =
  !isExpoGo && Boolean(NativeModules.RNGoogleMobileAdsModule);

const NativeWatchAdModal = !canUseGoogleMobileAds
  ? null
  : // eslint-disable-next-line @typescript-eslint/no-require-imports
    require("./WatchAdModal.tsx").WatchAdModal;

export function WatchAdModal(props: WatchAdModalProps) {
  const { visible, onAdRewardEarned, onClose } = props;

  useEffect(() => {
    if (canUseGoogleMobileAds || !visible) return;

    onAdRewardEarned();
    onClose();
  }, [onAdRewardEarned, onClose, visible]);

  if (!canUseGoogleMobileAds) return null;

  return <NativeWatchAdModal {...props} />;
}
