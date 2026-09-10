import { getNetworkStateAsync } from "expo-network";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

const NOTICE_DURATION_MS = 4_000;
const CONNECTIVITY_CHECK_INTERVAL_MS = 5_000;

function isNetworkConnected(networkState: {
  isConnected?: boolean | null;
  isInternetReachable?: boolean | null;
}) {
  return (
    networkState.isConnected === true &&
    networkState.isInternetReachable !== false
  );
}

export function NetworkStatusBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const previousConnectionRef = useRef<boolean | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [notice, setNotice] = useState<"offline" | "online" | null>(null);

  useEffect(() => {
    let active = true;

    const checkConnectivity = async () => {
      try {
        const networkState = await getNetworkStateAsync();
        if (!active) return;

        const isConnected = isNetworkConnected(networkState);
        const previousConnection = previousConnectionRef.current;
        previousConnectionRef.current = isConnected;

        if (previousConnection === isConnected) return;

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }

        if (!isConnected) {
          setNotice("offline");
          return;
        }

        if (previousConnection === false) {
          setNotice("online");
          timeoutRef.current = setTimeout(() => {
            if (active) {
              setNotice(null);
              timeoutRef.current = null;
            }
          }, NOTICE_DURATION_MS);
        } else {
          setNotice(null);
        }
      } catch {
        // Keep the last known status when the connectivity check fails.
      }
    };

    void checkConnectivity();
    const interval = setInterval(() => {
      void checkConnectivity();
    }, CONNECTIVITY_CHECK_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(interval);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
          {isOfflineNotice ? "You're offline" : "You're back online"}
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
