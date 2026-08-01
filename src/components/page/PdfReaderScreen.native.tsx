import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { colors, radius, spacing } from "../../constants/theme";

// Fallback timeout: if onLoadEnd never fires (can happen with some PDFs),
// hide the loading overlay after 20 seconds so the user isn't stuck.
const LOAD_TIMEOUT_MS = 20_000;

export function PdfReaderScreen() {
  const { uri, title } = useLocalSearchParams<{ uri: string; title?: string }>();

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const decodedUri = uri ? decodeURIComponent(uri as string) : null;
  const googleDocsUrl = decodedUri
    ? `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(decodedUri)}`
    : null;

  // Animate the progress bar to a target value
  const animateTo = (toValue: number, duration = 400) =>
    Animated.timing(progressAnim, { toValue, duration, useNativeDriver: false }).start();

  // Start a safety-net timer that dismisses the loading screen if the
  // WebView never fires onLoadEnd (common with large PDFs / slow connections)
  const startTimeout = () => {
    clearTimeout(timeoutRef.current!);
    timeoutRef.current = setTimeout(() => setLoaded(true), LOAD_TIMEOUT_MS);
  };

  useEffect(() => {
    animateTo(0.3, 200); // immediately fill 30 % to show something is happening
    startTimeout();
    return () => clearTimeout(timeoutRef.current!);
  }, []);

  const handleLoadEnd = () => {
    clearTimeout(timeoutRef.current!);
    animateTo(1, 300);
    setTimeout(() => setLoaded(true), 300);
  };

  const handleError = () => {
    clearTimeout(timeoutRef.current!);
    setLoaded(true);
    setLoadError(true);
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
  };

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (!decodedUri || !googleDocsUrl) {
    return (
      <View style={styles.center}>
        <Feather name="alert-circle" size={48} color="#CBD5E1" />
        <Text style={styles.errorText}>No PDF document available.</Text>
        <Pressable style={styles.backBtn} onPress={goBack}>
          <Text style={styles.backBtnText}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable style={styles.headerBack} onPress={goBack} accessibilityLabel="Close PDF">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || "PDF Reader"}
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* ── Animated progress bar ── */}
      {!loaded && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
        </View>
      )}

      {/* ── Loading overlay ── */}
      {!loaded && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Feather name="file-text" size={36} color={colors.primary} />
            <Text style={styles.loadingLabel}>Opening PDF…</Text>
            <View style={styles.loadingTrack}>
              <Animated.View style={[styles.loadingFill, { width: progressBarWidth }]} />
            </View>
          </View>
        </View>
      )}

      {/* ── Error state ── */}
      {loadError && (
        <View style={styles.center}>
          <Feather name="alert-triangle" size={52} color="#F59E0B" />
          <Text style={styles.errorTitle}>Failed to load PDF</Text>
          <Text style={styles.errorText}>
            The document could not be displayed.
          </Text>
          <Pressable style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      )}

      {/* ── WebView — always mounted so it loads in the background ── */}
      {!loadError && (
        <WebView
          source={{ uri: googleDocsUrl }}
          style={[styles.webview, !loaded && styles.webviewHidden]}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          allowsFullscreenVideo={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },

  // Header
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    ...Platform.select({
      ios: {
        shadowColor: "#0F172A",
        shadowOpacity: 0.06,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 4 },
    }),
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },

  // Progress bar
  progressTrack: {
    height: 3,
    backgroundColor: "#E2E8F0",
  },
  progressBar: {
    height: 3,
    backgroundColor: colors.primary,
  },

  // WebView
  webview: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },
  // Hide (but keep mounted) while loading, so it silently fetches in the background
  webviewHidden: {
    opacity: 0,
    height: 0,
    flex: 0,
  },

  // Loading overlay
  loadingOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
  },
  loadingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: radius.lg,
    padding: 32,
    alignItems: "center",
    width: 220,
    gap: 14,
  },
  loadingLabel: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "600",
    textAlign: "center",
  },
  loadingTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  loadingFill: {
    height: 6,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  // Error / empty states
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 32,
    backgroundColor: "#FFFFFF",
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: colors.text,
  },
  errorText: {
    fontSize: 13,
    color: colors.subtitle,
    textAlign: "center",
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
