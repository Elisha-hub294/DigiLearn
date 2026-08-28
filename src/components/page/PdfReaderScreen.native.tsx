import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { colors, radius, spacing } from "../../constants/theme";
import { saveDownloadedFile } from "../../services/downloadService";

// Fallback timeout: if onLoadEnd never fires (can happen with some PDFs),
// hide the loading overlay after 20 seconds so the user isn't stuck.
const LOAD_TIMEOUT_MS = 20_000;

import { useFirebaseStorageUrl } from "../../utils/firebaseStorage";

export function PdfReaderScreen() {
  const { uri, title } = useLocalSearchParams<{
    uri: string;
    title?: string;
  }>();

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [progressAnim] = useState(() => new Animated.Value(0));
  const [downloadProgressAnim] = useState(() => new Animated.Value(0));
  const [downloadScale] = useState(() => new Animated.Value(1));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const originalDecodedUri = uri ? decodeURIComponent(uri as string) : null;
  const resolvedUri = useFirebaseStorageUrl(originalDecodedUri ?? undefined);
  // While the hook is resolving, resolvedUri is undefined — don't fall back to the raw path
  const decodedUri = resolvedUri ?? null;
  const isResolving = originalDecodedUri != null && decodedUri == null;
  const isLocalFile = Boolean(decodedUri?.startsWith("file://"));

  // iOS WebView renders PDFs natively; Android needs pdf.js
  const webViewSource = (() => {
    if (!decodedUri) return null;
    if (isLocalFile) return { uri: decodedUri };
    if (Platform.OS === "ios") return { uri: decodedUri };

    // Android: self-contained pdf.js HTML viewer
    const escapedUrl = decodedUri
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "");
    return {
      html: `<!DOCTYPE html>
<html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=3">
<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#525659;overflow-x:hidden}
canvas{display:block;margin:4px auto;box-shadow:0 2px 8px rgba(0,0,0,.3)}
#error{color:#fff;text-align:center;padding:40px;font-family:sans-serif;display:none}
</style></head><body>
<div id="container"></div>
<div id="error"></div>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
(async()=>{
  try{
    const pdf=await pdfjsLib.getDocument('${escapedUrl}').promise;
    const c=document.getElementById('container');
    for(let i=1;i<=pdf.numPages;i++){
      const pg=await pdf.getPage(i);
      const s=window.innerWidth/pg.getViewport({scale:1}).width;
      const vp=pg.getViewport({scale:s});
      const cv=document.createElement('canvas');
      cv.width=vp.width;cv.height=vp.height;
      c.appendChild(cv);
      await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;
    }
    window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'loaded',pages:pdf.numPages}));
  }catch(e){
    document.getElementById('error').style.display='block';
    document.getElementById('error').textContent='Failed to load PDF: '+e.message;
    window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:e.message}));
  }
})();
</script></body></html>`,
      baseUrl: "https://cdnjs.cloudflare.com",
    };
  })();

  // Animate the progress bar to a target value
  const animateTo = useCallback(
    (toValue: number, duration = 400) =>
      Animated.timing(progressAnim, {
        toValue,
        duration,
        useNativeDriver: false,
      }).start(),
    [progressAnim],
  );

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
  }, [animateTo]);

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

  /** Download the PDF with real-time progress animation */
  const handleDownload = async () => {
    if (!decodedUri || downloading || downloaded || isLocalFile) return;

    setDownloading(true);
    setDownloadProgress(0);
    downloadProgressAnim.setValue(0);

    // Quick bounce animation for tactile feedback
    Animated.sequence([
      Animated.timing(downloadScale, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(downloadScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const fileName =
        (title ? title.replace(/[^a-zA-Z0-9_\- ]/g, "") : "document") + ".pdf";
      const fileUri = FileSystem.documentDirectory + fileName;

      const downloadResumable = FileSystem.createDownloadResumable(
        decodedUri,
        fileUri,
        {},
        (dp) => {
          if (dp.totalBytesExpectedToWrite > 0) {
            const p = dp.totalBytesWritten / dp.totalBytesExpectedToWrite;
            setDownloadProgress(p);
            Animated.timing(downloadProgressAnim, {
              toValue: p,
              duration: 150,
              useNativeDriver: false,
            }).start();
          }
        },
      );

      const downloadResult = await downloadResumable.downloadAsync();

      if (downloadResult && downloadResult.status === 200) {
        // Ensure progress fills to 100% on finish
        setDownloadProgress(1);
        Animated.timing(downloadProgressAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: false,
        }).start();

        // Save to Downloaded files registry
        await saveDownloadedFile({
          title: title || "PDF Document",
          uri: decodedUri,
          localUri: downloadResult.uri,
        });
        setDownloaded(true);

        setTimeout(() => {
          Alert.alert(
            "Download Complete",
            `"${fileName}" has been saved to your device.`,
            [{ text: "OK" }],
          );
        }, 300);
      } else {
        Alert.alert(
          "Download Failed",
          "The file could not be downloaded. Please try again.",
        );
      }
    } catch (err) {
      console.warn("PDF download error:", err);
      Alert.alert(
        "Download Error",
        "Something went wrong while downloading the file.",
      );
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
      }, 600);
    }
  };

  const progressBarWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const downloadBarWidth = downloadProgressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  if (isResolving) {
    return (
      <View style={styles.screen}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerBack}
            onPress={goBack}
            accessibilityLabel="Close PDF"
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title || "PDF Reader"}
            </Text>
          </View>
        </View>
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Feather name="file-text" size={36} color={colors.primary} />
            <Text style={styles.loadingLabel}>Loading PDF…</Text>
          </View>
        </View>
      </View>
    );
  }

  if (!decodedUri || !webViewSource) {
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
        <Pressable
          style={styles.headerBack}
          onPress={goBack}
          accessibilityLabel="Close PDF"
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || "PDF Reader"}
          </Text>
        </View>

        {/* ── Download button with gradient (only for online files) ── */}
        {!isLocalFile && (
          <Animated.View style={{ transform: [{ scale: downloadScale }] }}>
            <Pressable
              onPress={handleDownload}
              disabled={downloading || downloaded}
              accessibilityLabel="Download PDF"
              style={({ pressed }) => [
                styles.downloadBtn,
                pressed && { opacity: 0.85 },
                (downloading || downloaded) && { opacity: 0.5 },
              ]}
            >
              <LinearGradient
                colors={["#006eff", "#6C63FF", "#A855F7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.downloadGradient}
              >
                <Text style={styles.downloadText}>
                  {downloading
                    ? `${Math.round(downloadProgress * 100)}%`
                    : downloaded
                      ? "Downloaded"
                      : "Download"}
                </Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* ── Active File Download Progress Banner & Bar ── */}
      {downloading && (
        <View style={styles.downloadProgressBanner}>
          <View style={styles.downloadProgressInfo}>
            <Feather name="download-cloud" size={16} color="#006eff" />
            <Text style={styles.downloadProgressLabel}>
              Downloading file… {Math.round(downloadProgress * 100)}%
            </Text>
          </View>
          <View style={styles.downloadTrack}>
            <Animated.View
              style={[styles.downloadFill, { width: downloadBarWidth }]}
            >
              <LinearGradient
                colors={["#006eff", "#6C63FF", "#A855F7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </Animated.View>
          </View>
        </View>
      )}

      {/* ── Animated progress bar ── */}
      {!loaded && !downloading && (
        <View style={styles.progressTrack}>
          <Animated.View
            style={[styles.progressBar, { width: progressBarWidth }]}
          />
        </View>
      )}

      {/* ── Loading overlay ── */}
      {!loaded && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <Feather name="file-text" size={36} color={colors.primary} />
            <Text style={styles.loadingLabel}>Opening PDF…</Text>
            <View style={styles.loadingTrack}>
              <Animated.View
                style={[styles.loadingFill, { width: progressBarWidth }]}
              />
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
      {!loadError && webViewSource && (
        <WebView
          source={webViewSource}
          style={[styles.webview, !loaded && styles.webviewHidden]}
          onLoadEnd={handleLoadEnd}
          onError={handleError}
          javaScriptEnabled
          domStorageEnabled
          allowFileAccess
          allowingReadAccessToURL={decodedUri || undefined}
          originWhitelist={["*"]}
          startInLoadingState={false}
          allowsFullscreenVideo={false}
          mixedContentMode="compatibility"
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
    fontWeight: "500",
    color: colors.primary,
  },

  // Download button
  downloadBtn: {
    borderRadius: radius.pill,
    ...Platform.select({
      ios: {
        shadowColor: "#6C63FF",
        shadowOpacity: 0.35,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
      },
      android: { elevation: 6 },
    }),
  },
  downloadGradient: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.pill,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "500",
  },

  // Download Progress Banner
  downloadProgressBanner: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    gap: 6,
  },
  downloadProgressInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  downloadProgressLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.text,
  },
  downloadTrack: {
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
  },
  downloadFill: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
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
