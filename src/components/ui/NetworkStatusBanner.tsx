import { useNetworkState } from "expo-network";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

const NOTICE_DURATION_MS = 4_000;

export function NetworkStatusBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const networkState = useNetworkState();
  const previousConnectionRef = useRef<boolean | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notice, setNotice] = useState<"offline" | "online" | null>(null);

  const isConnected =
    networkState.isConnected === true &&
    networkState.isInternetReachable !== false;

  useEffect(() => {
    if (networkState.isConnected == null) return;

    const previousConnection = previousConnectionRef.current;
    previousConnectionRef.current = isConnected;

    if (previousConnection === null || previousConnection === isConnected) {
      return;
    }

    setNotice(isConnected ? "online" : "offline");
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setNotice(null);
      timeoutRef.current = null;
    }, NOTICE_DURATION_MS);
  }, [isConnected, networkState.isConnected]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!notice) return null;

  const isOfflineNotice = notice === "offline";

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { paddingTop: insets.top + spacing.sm }]}
    >
      <View
        style={[
          styles.banner,
          {
            backgroundColor: isOfflineNotice ? colors.primaryRed : colors.green,
          },
        ]}
      >
        <Text style={styles.text}>
          {isOfflineNotice ? "You're offline" : "back online"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 10,
  },
  banner: {
    minWidth: 150,
    maxWidth: "90%",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
});
