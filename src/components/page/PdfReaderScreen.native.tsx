import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import { LinearGradient } from "expo-linear-gradient";
import { useNetworkState } from "expo-network";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  NativeModules,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from "react-native";
import { WebView } from "react-native-webview";
import { colors, radius, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";
import { recordPageVisit } from "../../services/activityService";
import {
  getDownloadedFiles,
  saveDownloadedFile,
} from "../../services/downloadService";
import {
  getPageReadingProgress,
  savePageReadingProgress,
} from "../../services/readingProgressService";
import { useFirebaseStorageUrl } from "../../utils/firebaseStorage";
import { extractDocxText } from "../library/add-item/pdfService";
import { ActionDialog } from "../ui/ActionDialog";

// Fallback timeout: if onLoadEnd never fires (can happen with some PDFs),
// hide the loading overlay after 20 seconds so the user isn't stuck.
const LOAD_TIMEOUT_MS = 20_000;

let NativePdfComponent: any = null;
try {
  const hasNativePdf =
    !!NativeModules.RNPDFPdfViewManager ||
    !!UIManager.getViewManagerConfig?.("RNPDFPdfView");
  if (hasNativePdf) NativePdfComponent = require("react-native-pdf").default;
} catch {
  NativePdfComponent = null;
}

function normalizeUriParam(
  raw: string | string[] | undefined | null,
): string | null {
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return null;
  let result = str.trim();
  // Expo Router serializes route params. Some existing callers also encode
  // document paths themselves, so decode one layer before resolving Firebase
  // storage paths such as "docs%2Flesson.pdf".
  if (/%[0-9a-f]{2}/i.test(result)) {
    try {
      result = decodeURIComponent(result);
    } catch {
      // keep as is
    }
  }
  return result;
}

function getFileExtension(uri: string | null): string {
  const path = uri?.split("?")[0].toLowerCase() ?? "";
  const match = path.match(/\.(pdf|docx|pptx|ppt)$/);
  return match?.[1] ?? "pdf";
}

function getDownloadFileName(
  title: string | string[] | undefined,
  uri: string,
  extension: string,
): string {
  const safeTitle =
    (typeof title === "string"
      ? title.trim().replace(/[^a-zA-Z0-9_\- ]/g, "")
      : "Document") || "Document";
  // A title alone is not unique. Include a stable suffix so two resources
  // named alike cannot overwrite each other in the app documents directory.
  let hash = 0;
  for (let index = 0; index < uri.length; index += 1) {
    hash = (hash * 31 + uri.charCodeAt(index)) >>> 0;
  }
  return `${safeTitle}_${hash.toString(36)}.${extension}`;
}

export function PdfReaderScreen() {
  const { colors: themeColors } = useTheme();
  const {
    uri,
    document: pdfDocument,
    pageId,
    title,
    initialPage,
  } = useLocalSearchParams<{
    uri?: string;
    document?: string;
    pageId?: string;
    title?: string;
    initialPage?: string;
  }>();

  const [startPage, setStartPage] = useState<number>(() => {
    const p = parseInt(initialPage ?? "", 10);
    return isNaN(p) || p < 1 ? 1 : p;
  });
  const [currentPageNum, setCurrentPageNum] = useState<number>(startPage);
  const [totalPagesCount, setTotalPagesCount] = useState<number>(0);

  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [loadErrorMessage, setLoadErrorMessage] = useState(
    "The document could not be displayed.",
  );
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [offlineNoticeDismissed, setOfflineNoticeDismissed] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [localBase64, setLocalBase64] = useState<string | null>(null);
  // For Android remote PDFs: pre-fetched base64 to avoid CORS inside WebView
  const [remoteBase64, setRemoteBase64] = useState<string | null>(null);
  const [remoteFetchError, setRemoteFetchError] = useState(false);
  const [docxText, setDocxText] = useState<string | null>(null);
  const [noticeDialog, setNoticeDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [progressAnim] = useState(() => new Animated.Value(0));
  const [downloadProgressAnim] = useState(() => new Animated.Value(0));
  const [downloadScale] = useState(() => new Animated.Value(1));
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const networkState = useNetworkState();

  const rawUri = normalizeUriParam(uri ?? pdfDocument);
  const resolvedUri = useFirebaseStorageUrl(rawUri ?? undefined);
  // While the hook is resolving, resolvedUri is undefined — don't fall back to the raw path
  const decodedUri = resolvedUri ?? null;
  const isResolving = rawUri != null && decodedUri == null;
  const isLocalFile = Boolean(decodedUri?.startsWith("file://"));
  const fileExtension = getFileExtension(decodedUri);
  const isOfficeFile = ["docx", "ppt", "pptx"].includes(fileExtension);
  const isDocxFile = fileExtension === "docx";
  const useNativePdf =
    Platform.OS === "android" && Boolean(NativePdfComponent) && !isOfficeFile;
  const isOffline =
    networkState.isConnected === false ||
    networkState.isInternetReachable === false;

  useEffect(() => {
    if (pageId) void recordPageVisit(pageId);
  }, [pageId]);

  useEffect(() => {
    let active = true;
    if (pageId && !initialPage) {
      getPageReadingProgress(pageId).then((prog) => {
        if (!active) return;
        if (prog && prog.lastPage > 1) {
          setStartPage(prog.lastPage);
          setCurrentPageNum(prog.lastPage);
          if (prog.totalPages) setTotalPagesCount(prog.totalPages);
        }
      });
    }
    return () => {
      active = false;
    };
  }, [pageId, initialPage]);

  // Check if file is already downloaded in storage
  useEffect(() => {
    let active = true;
    getDownloadedFiles().then((files) => {
      if (!active) return;
      const isAlreadyDownloaded = files.some(
        (f) =>
          (decodedUri && f.uri === decodedUri) ||
          (decodedUri && f.localUri === decodedUri) ||
          (rawUri && f.uri === rawUri) ||
          (rawUri && f.localUri === rawUri) ||
          (title && f.title === title),
      );
      if (isAlreadyDownloaded || isLocalFile) {
        setDownloaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, [decodedUri, isLocalFile, rawUri, title]);

  // Read local file as base64 on Android for pdf.js offline rendering
  useEffect(() => {
    if (Platform.OS === "android" && isLocalFile && decodedUri) {
      FileSystem.readAsStringAsync(decodedUri, {
        encoding: FileSystem.EncodingType?.Base64 ?? "base64",
      })
        .then((b64) => setLocalBase64(b64))
        .catch((err) => {
          console.warn("Failed to read local PDF as base64 for Android:", err);
        });
    }
  }, [isLocalFile, decodedUri]);

  // Android remote PDF: download to a temp file and read as base64 to avoid
  // CORS errors when pdf.js tries to fetch() the Firebase Storage URL from
  // inside a WebView (the native-layer download has no CORS restrictions).
  useEffect(() => {
    if (
      Platform.OS !== "android" ||
      isLocalFile ||
      isOfficeFile ||
      !decodedUri ||
      useNativePdf
    )
      return;

    let active = true;

    const tmpPath = `${FileSystem.cacheDirectory}pdf_tmp_${Date.now()}.pdf`;

    FileSystem.downloadAsync(decodedUri, tmpPath)
      .then(async (result) => {
        if (!active) return;
        if (!result || result.status < 200 || result.status >= 300) {
          console.warn("PDF remote download failed, status:", result?.status);
          if (active) setRemoteFetchError(true);
          return;
        }
        const b64 = await FileSystem.readAsStringAsync(result.uri, {
          encoding: FileSystem.EncodingType?.Base64 ?? "base64",
        });
        if (active) {
          setRemoteFetchError(false);
          setRemoteBase64(b64);
        }
        // Clean up temp file (fire-and-forget)
        FileSystem.deleteAsync(result.uri, { idempotent: true }).catch(
          () => {},
        );
      })
      .catch((err) => {
        console.warn("Failed to pre-fetch remote PDF for Android:", err);
        if (active) setRemoteFetchError(true);
      });

    return () => {
      active = false;
    };
  }, [decodedUri, isLocalFile, isOfficeFile, useNativePdf]);

  useEffect(() => {
    if (!isDocxFile || !decodedUri) return;

    let active = true;

    const loadDocx = async () => {
      try {
        const data = isLocalFile
          ? await FileSystem.readAsStringAsync(decodedUri, {
              encoding: FileSystem.EncodingType?.Base64 ?? "base64",
            })
          : await (await fetch(decodedUri)).arrayBuffer();
        const text = await extractDocxText(data);
        if (active) {
          setDocxText(text);
          setLoaded(true);
        }
      } catch (error) {
        console.warn("Failed to open DOCX document:", error);
        if (active) {
          setLoaded(true);
          setLoadError(true);
          setLoadErrorMessage("This DOCX document could not be opened.");
        }
      }
    };

    void loadDocx();
    return () => {
      active = false;
    };
  }, [decodedUri, isDocxFile, isLocalFile]);

  // The base64 payload used by the pdf.js HTML template
  // – for local files it's read directly; for Android remote PDFs it's pre-fetched
  //   at the native layer to avoid CORS restrictions inside the WebView.
  const pdfBase64 = isLocalFile ? localBase64 : remoteBase64;

  // Shared pdf.js HTML template that loads a PDF from a base64 buffer
  function buildBase64PdfHtml(b64: string, page: number): string {
    return `<!DOCTYPE html>
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
    const rawData = atob('${b64}');
    const uint8Array = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      uint8Array[i] = rawData.charCodeAt(i);
    }
    const pdf=await pdfjsLib.getDocument({data: uint8Array}).promise;
    const c=document.getElementById('container');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const p = parseInt(entry.target.getAttribute('data-page'), 10);
          if (p) {
            window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({type:'pageChange',page:p,totalPages:pdf.numPages}));
          }
        }
      });
    }, { threshold: 0.3 });
    const dpr = window.devicePixelRatio || 1;
    for(let i=1;i<=pdf.numPages;i++){
      const pg=await pdf.getPage(i);
      const baseVp=pg.getViewport({scale:1});
      const cssWidth=window.innerWidth;
      const scale=cssWidth/baseVp.width;
      const vp=pg.getViewport({scale: scale * dpr});
      const cv=document.createElement('canvas');
      cv.setAttribute('data-page', i);
      cv.width=vp.width;
      cv.height=vp.height;
      cv.style.width=cssWidth+'px';
      cv.style.height=(vp.height/dpr)+'px';
      c.appendChild(cv);
      await pg.render({canvasContext:cv.getContext('2d'),viewport:vp}).promise;
      observer.observe(cv);
    }
    window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'loaded',pages:pdf.numPages}));
    const targetP = ${page};
    if (targetP > 1) {
      setTimeout(() => {
        const el = document.querySelector('canvas[data-page="' + targetP + '"]');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 350);
    }
  }catch(e){
    document.getElementById('error').style.display='block';
    document.getElementById('error').textContent='Failed to load PDF: '+e.message;
    window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(JSON.stringify({type:'error',message:e.message}));
  }
})();
</script></body></html>`;
  }

  // iOS WebView renders PDFs natively; Android needs pdf.js
  const webViewSource = (() => {
    if (!decodedUri) return null;
    if (isOfficeFile) {
      if (isDocxFile) return null;
      if (isLocalFile) return null;
      return {
        uri: `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(decodedUri)}`,
      };
    }
    if (Platform.OS === "ios") return { uri: decodedUri };

    // Android: self-contained pdf.js HTML viewer using a base64 buffer.
    // Both local and remote PDFs go through this path — the native-layer
    // download (FileSystem.downloadAsync) is CORS-free, so we never rely on
    // pdf.js fetch() hitting the network from inside the WebView.
    if (!pdfBase64) return null; // still loading / fetch error
    return {
      html: buildBase64PdfHtml(pdfBase64, startPage),
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
  const startTimeout = useCallback(() => {
    clearTimeout(timeoutRef.current!);
    timeoutRef.current = setTimeout(() => {
      setLoaded(true);
      setLoadError(true);
      setLoadErrorMessage(
        isLocalFile
          ? "This downloaded file could not be opened. It may be incomplete or no longer available."
          : "This document is not available offline. Connect to the internet or open a downloaded copy.",
      );
    }, LOAD_TIMEOUT_MS);
  }, [isLocalFile]);

  useEffect(() => {
    animateTo(0.3, 200); // immediately fill 30 % to show something is happening
    startTimeout();
    return () => clearTimeout(timeoutRef.current!);
  }, [animateTo, startTimeout]);

  const handleLoadEnd = () => {
    clearTimeout(timeoutRef.current!);
    animateTo(1, 300);
    setTimeout(() => setLoaded(true), 300);
  };

  const handleError = () => {
    clearTimeout(timeoutRef.current!);
    setLoaded(true);
    setLoadError(true);
    setLoadErrorMessage(
      isLocalFile
        ? "This downloaded file could not be opened. It may be incomplete or no longer available."
        : "This document is not available offline. Connect to the internet or open a downloaded copy.",
    );
  };

  const handleMessage = (event: { nativeEvent: { data: string } }) => {
    try {
      const message = JSON.parse(event.nativeEvent.data) as {
        type?: string;
        page?: number;
        pages?: number;
        totalPages?: number;
      };
      if (message.type === "loaded") {
        handleLoadEnd();
        if (typeof message.pages === "number" && message.pages > 0) {
          setTotalPagesCount(message.pages);
        }
      } else if (
        message.type === "pageChange" &&
        typeof message.page === "number"
      ) {
        const p = message.page;
        const total = message.totalPages ?? message.pages;
        setCurrentPageNum(p);
        if (typeof total === "number" && total > 0) {
          setTotalPagesCount(total);
        }
        if (pageId) {
          void savePageReadingProgress(pageId, p, total, {
            title: title || "PDF",
            documentUri: decodedUri || rawUri || undefined,
          });
        }
      } else if (message.type === "error") {
        handleError();
      }
    } catch {
      // Ignore messages that are not from the PDF viewer.
    }
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
      const fileName = getDownloadFileName(title, decodedUri, fileExtension);
      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

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

        let fileSize: number | undefined;
        try {
          const fileInfo = await FileSystem.getInfoAsync(downloadResult.uri);
          if (fileInfo.exists && typeof (fileInfo as any).size === "number") {
            fileSize = (fileInfo as any).size;
          }
        } catch (infoErr) {
          console.warn("Could not determine downloaded file size:", infoErr);
        }

        // Save to Downloaded files registry
        await saveDownloadedFile({
          title: title || "PDF Document",
          uri: decodedUri,
          localUri: downloadResult.uri,
          fileSize,
        });
        setDownloaded(true);

        setTimeout(() => {
          setNoticeDialog({
            title: "Download Complete",
            message: `"${fileName}" has been saved to your downloads for offline reading.`,
          });
        }, 300);
      } else {
        setNoticeDialog({
          title: "Download Failed",
          message: "The file could not be downloaded. Please try again.",
        });
      }
    } catch (err) {
      console.warn("PDF download error:", err);
      setNoticeDialog({
        title: "Download Error",
        message: "Something went wrong while downloading the file.",
      });
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

  // Also wait while we're pre-fetching the remote PDF bytes on Android
  const isPreFetching =
    Platform.OS === "android" &&
    !isLocalFile &&
    !isOfficeFile &&
    !useNativePdf &&
    decodedUri != null &&
    remoteBase64 == null &&
    !remoteFetchError;

  if (isResolving || isPreFetching) {
    return (
      <View
        style={[styles.screen, { backgroundColor: themeColors.background }]}
      >
        <View
          style={[
            styles.header,
            {
              backgroundColor: themeColors.white,
              borderBottomColor: themeColors.border,
            },
          ]}
        >
          <Pressable
            style={[
              styles.headerBack,
              { backgroundColor: themeColors.lightBackground },
            ]}
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
            <Text style={[styles.loadingLabel, { color: themeColors.text }]}>
              Loading PDF…
            </Text>
          </View>
        </View>
      </View>
    );
  }

  if (!decodedUri || (!webViewSource && !useNativePdf && !isDocxFile)) {
    return (
      <>
        <ActionDialog
          visible
          title={
            isOfficeFile ? "Internet connection required" : "PDF unavailable"
          }
          message={
            isOfficeFile
              ? "Office documents can only be read while online. Connect to the internet and try again."
              : "No PDF document is available to open."
          }
          primaryText="Go back"
          onPrimary={goBack}
          onClose={goBack}
        />
        <View
          style={[styles.center, { backgroundColor: themeColors.background }]}
        >
          <Feather name="alert-circle" size={48} color="#CBD5E1" />
        </View>
      </>
    );
  }

  return (
    <>
      <ActionDialog
        visible={
          Boolean(noticeDialog) ||
          loadError ||
          (isOffline && !isLocalFile && !offlineNoticeDismissed)
        }
        title={
          loadError
            ? "Unable to open document"
            : isOffline && !noticeDialog
              ? "Internet connection required"
              : (noticeDialog?.title ?? "Notice")
        }
        message={
          loadError
            ? loadErrorMessage
            : isOffline && !noticeDialog
              ? "This document is not available offline. Connect to the internet or open a downloaded copy."
              : (noticeDialog?.message ?? "")
        }
        primaryText={loadError ? "Go back" : "OK"}
        onPrimary={
          loadError
            ? goBack
            : () => {
                setNoticeDialog(null);
                setOfflineNoticeDismissed(true);
              }
        }
        onClose={
          loadError
            ? goBack
            : () => {
                setNoticeDialog(null);
                setOfflineNoticeDismissed(true);
              }
        }
      />
      <View
        style={[styles.screen, { backgroundColor: themeColors.background }]}
      >
        {/* ── Header ── */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: themeColors.white,
              borderBottomColor: themeColors.border,
            },
          ]}
        >
          <Pressable
            style={[
              styles.headerBack,
              { backgroundColor: themeColors.lightBackground },
            ]}
            onPress={goBack}
            accessibilityLabel="Close PDF"
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {title || `${isOfficeFile ? "Office" : "PDF"} Reader`}
            </Text>
            {currentPageNum > 0 ? (
              <Text style={styles.headerSubTitle} numberOfLines={1}>
                Page {currentPageNum}
                {totalPagesCount > 0 ? ` of ${totalPagesCount}` : ""}
              </Text>
            ) : null}
          </View>

          {/* ── Download button with gradient (only for online files) ── */}
          {!isLocalFile && (
            <Animated.View style={{ transform: [{ scale: downloadScale }] }}>
              <Pressable
                onPress={handleDownload}
                disabled={downloading || downloaded}
                accessibilityLabel={`Download ${isOfficeFile ? "office document" : "PDF"}`}
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
          <View
            style={[
              styles.downloadProgressBanner,
              {
                backgroundColor: themeColors.white,
                borderBottomColor: themeColors.border,
              },
            ]}
          >
            <View style={styles.downloadProgressInfo}>
              <Feather name="download-cloud" size={16} color="#006eff" />
              <Text
                style={[
                  styles.downloadProgressLabel,
                  { color: themeColors.text },
                ]}
              >
                Downloading file… {Math.round(downloadProgress * 100)}%
              </Text>
            </View>
            <View
              style={[
                styles.downloadTrack,
                { backgroundColor: themeColors.border },
              ]}
            >
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
          <View
            style={[
              styles.loadingOverlay,
              { backgroundColor: themeColors.background },
            ]}
          >
            <View
              style={[
                styles.loadingCard,
                { backgroundColor: themeColors.white },
              ]}
            >
              <Feather name="file-text" size={36} color={colors.primary} />
              <Text style={[styles.loadingLabel, { color: themeColors.text }]}>
                Opening PDF…
              </Text>
              <View
                style={[
                  styles.loadingTrack,
                  { backgroundColor: themeColors.border },
                ]}
              >
                <Animated.View
                  style={[styles.loadingFill, { width: progressBarWidth }]}
                />
              </View>
            </View>
          </View>
        )}

        {/* ── Error state ── */}
        {loadError && (
          <View
            style={[styles.center, { backgroundColor: themeColors.background }]}
          >
            <Feather name="alert-triangle" size={52} color="#F59E0B" />
          </View>
        )}

        {isDocxFile && !loadError && docxText !== null && (
          <ScrollView
            style={styles.docxContent}
            contentContainerStyle={styles.docxContentContainer}
          >
            {docxText.split("\n").map((paragraph, index) => (
              <Text
                key={`${index}-${paragraph.slice(0, 12)}`}
                style={[styles.docxParagraph, { color: themeColors.text }]}
              >
                {paragraph || " "}
              </Text>
            ))}
          </ScrollView>
        )}

        {/* ── WebView — always mounted so it loads in the background ── */}
        {!loadError && useNativePdf && decodedUri && (
          <NativePdfComponent
            source={{ uri: decodedUri, cache: true }}
            page={startPage}
            style={styles.webview}
            onLoadComplete={(numberOfPages: number) => {
              setTotalPagesCount(numberOfPages);
              handleLoadEnd();
            }}
            onPageChanged={(page: number, numberOfPages: number) => {
              setCurrentPageNum(page);
              setTotalPagesCount(numberOfPages);
              if (pageId) {
                void savePageReadingProgress(pageId, page, numberOfPages, {
                  title: title || "PDF",
                  documentUri: decodedUri || rawUri || undefined,
                });
              }
            }}
            onError={handleError}
            enablePaging={false}
            fitPolicy={0}
            trustAllCerts={false}
          />
        )}

        {!loadError && !useNativePdf && webViewSource && (
          <WebView
            source={webViewSource}
            style={[styles.webview, !loaded && styles.webviewHidden]}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onMessage={handleMessage}
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
    </>
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
        boxShadow: "0px 2px 6px rgba(15, 23, 42, 0.06)",
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
  headerSubTitle: {
    fontSize: 11,
    color: colors.subtitle,
    marginTop: 1,
  },

  // Download button
  downloadBtn: {
    borderRadius: radius.pill,
    ...Platform.select({
      ios: {
        boxShadow: "0px 3px 8px rgba(108, 99, 255, 0.35)",
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
  docxContent: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  docxContentContainer: {
    padding: spacing.lg,
  },
  docxParagraph: {
    fontSize: 16,
    lineHeight: 25,
    marginBottom: spacing.md,
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
