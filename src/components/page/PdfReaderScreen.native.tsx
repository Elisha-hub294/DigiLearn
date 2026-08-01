import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Pdf from "react-native-pdf";
import { colors, radius, spacing } from "../../constants/theme";

export function PdfReaderScreen() {
  const { uri, title } = useLocalSearchParams<{ uri: string; title?: string }>();
  const { width, height } = useWindowDimensions();

  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const animateProgress = (value: number) => {
    Animated.timing(progressAnim, {
      toValue: value,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const goBack = () => {
    if (router.canGoBack()) router.back();
  };

  if (!uri) {
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

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

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
          {totalPages > 0 && (
            <Text style={styles.headerSub}>
              {currentPage} / {totalPages}
            </Text>
          )}
        </View>

        <View style={{ width: 40 }} />
      </View>

      {/* ── Loading progress bar ── */}
      {!loaded && (
        <View style={styles.progressTrack}>
          <Animated.View style={[styles.progressBar, { width: progressBarWidth }]} />
        </View>
      )}

      {/* ── Error state ── */}
      {loadError ? (
        <View style={styles.center}>
          <Feather name="alert-triangle" size={52} color="#F59E0B" />
          <Text style={styles.errorTitle}>Failed to load PDF</Text>
          <Text style={styles.errorText}>{loadError}</Text>
          <Pressable style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        /* ── PDF Viewer ── */
        <Pdf
          source={{ uri, cache: true }}
          style={[styles.pdf, { width, height: height - 72 }]}
          fitPolicy={0}
          enableAntialiasing
          enableAnnotationRendering
          trustAllCerts={false}
          onLoadProgress={(percent) => {
            setProgress(percent);
            animateProgress(percent);
          }}
          onLoadComplete={(pages) => {
            setTotalPages(pages);
            setLoaded(true);
            animateProgress(1);
          }}
          onPageChanged={(page, pages) => {
            setCurrentPage(page);
            setTotalPages(pages);
          }}
          onError={(error) => {
            const msg =
              typeof error === "object" && error !== null && "message" in error
                ? String((error as any).message)
                : "Unknown error";
            setLoadError(msg);
          }}
          renderActivityIndicator={(p) => (
            <View style={styles.loadingOverlay}>
              <View style={styles.loadingCard}>
                <Feather name="file-text" size={36} color={colors.primary} />
                <Text style={styles.loadingLabel}>
                  Loading PDF… {Math.round(p * 100)}%
                </Text>
                <View style={styles.loadingTrack}>
                  <View style={[styles.loadingFill, { width: `${Math.round(p * 100)}%` }]} />
                </View>
              </View>
            </View>
          )}
        />
      )}

      {/* ── Page indicator pill (bottom) ── */}
      {loaded && totalPages > 0 && (
        <View style={styles.pagePill} pointerEvents="none">
          <Text style={styles.pagePillText}>
            {currentPage} / {totalPages}
          </Text>
        </View>
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
  headerSub: {
    fontSize: 11,
    color: colors.subtitle,
    marginTop: 1,
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

  // PDF
  pdf: {
    flex: 1,
    backgroundColor: "#1A1A2E",
  },

  // Loading overlay (custom renderActivityIndicator)
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

  // Page indicator pill
  pagePill: {
    position: "absolute",
    bottom: 16,
    alignSelf: "center",
    backgroundColor: "rgba(15,23,42,0.72)",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 999,
  },
  pagePillText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
});
