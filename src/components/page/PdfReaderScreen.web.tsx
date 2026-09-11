import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";
import { recordPageVisit } from "../../services/activityService";
import {
  getDownloadedFiles,
  getWebDownloadedFileUrl,
  saveDownloadedFile,
} from "../../services/downloadService";
import {
  getPageReadingProgress,
  savePageReadingProgress,
} from "../../services/readingProgressService";

import { useTheme } from "../../contexts/ThemeContext";
import { useFirebaseStorageUrl } from "../../utils/firebaseStorage";
import { extractDocxText } from "../library/add-item/pdfService";
import { ActionDialog } from "../ui/ActionDialog";

function normalizeUriParam(
  raw: string | string[] | undefined | null,
): string | null {
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return null;
  let result = str.trim();
  // Decode encoded bare storage paths (for example, docs%2Flesson.pdf), but
  // never decode a complete URL. Firebase Storage requires the object path in
  // its /o/ endpoint to remain percent-encoded; decoding its %2F makes the
  // URL invalid and Firebase responds with HTTP 400.
  const isCompleteUrl = /^[a-z][a-z\d+.-]*:\/\//i.test(result);
  if (!isCompleteUrl && /%[0-9a-f]{2}/i.test(result)) {
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
  const [currentPage, setCurrentPage] = useState(startPage);
  const [progressReady, setProgressReady] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [offlineNoticeVisible, setOfflineNoticeVisible] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [localBlobUri, setLocalBlobUri] = useState<string | null>(null);
  const [docxText, setDocxText] = useState<string | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
  };

  const rawUri = normalizeUriParam(uri ?? pdfDocument);
  useEffect(() => {
    let active = true;
    if (rawUri?.startsWith("indexeddb://")) {
      getWebDownloadedFileUrl(rawUri).then((url) => {
        if (active) setLocalBlobUri(url);
      });
    }
    return () => {
      active = false;
    };
  }, [rawUri]);

  useEffect(() => {
    return () => {
      if (localBlobUri?.startsWith("blob:")) URL.revokeObjectURL(localBlobUri);
    };
  }, [localBlobUri]);

  const sourceUri = rawUri?.startsWith("indexeddb://") ? localBlobUri : rawUri;
  const resolvedUri = useFirebaseStorageUrl(sourceUri ?? undefined);
  // While the hook is resolving, resolvedUri is undefined — don't fall back to the raw path
  const decodedUri = resolvedUri ?? null;
  const isResolving = rawUri != null && decodedUri == null;
  const fileExtension = getFileExtension(decodedUri);
  const isOfficeFile = ["docx", "ppt", "pptx"].includes(fileExtension);
  const isDocxFile = fileExtension === "docx";

  useEffect(() => {
    if (!isDocxFile || !decodedUri) return;

    let active = true;
    const loadDocx = async () => {
      try {
        const response = await fetch(decodedUri);
        if (!response.ok)
          throw new Error(`DOCX request failed: ${response.status}`);
        const text = await extractDocxText(await response.arrayBuffer());
        if (active) setDocxText(text);
      } catch (error) {
        console.warn("Failed to open DOCX document:", error);
        if (active) setIframeError(true);
      }
    };

    void loadDocx();
    return () => {
      active = false;
    };
  }, [decodedUri, isDocxFile]);

  useEffect(() => {
    if (pageId) void recordPageVisit(pageId);
  }, [pageId]);

  useEffect(() => {
    let active = true;
    if (!pageId) {
      setProgressReady(true);
      return () => {
        active = false;
      };
    }

    setProgressReady(false);
    if (initialPage) {
      const page = parseInt(initialPage, 10);
      if (!isNaN(page) && page > 0) setCurrentPage(page);
      setProgressReady(true);
      return () => {
        active = false;
      };
    }

    getPageReadingProgress(pageId).then((prog) => {
      if (!active) return;
      if (prog && prog.lastPage > 1) {
        setStartPage(prog.lastPage);
        setCurrentPage(prog.lastPage);
      }
      setProgressReady(true);
    });
    return () => {
      active = false;
    };
  }, [pageId, initialPage]);

  useEffect(() => {
    if (!progressReady || !pageId || !decodedUri || isOfficeFile) return;

    void savePageReadingProgress(pageId, currentPage, undefined, {
      title: title || "PDF",
      documentUri: decodedUri,
    });
  }, [currentPage, decodedUri, isOfficeFile, pageId, progressReady, title]);

  const readerLabel = isOfficeFile ? "Office Reader" : "PDF Reader";
  const viewerUri = isOfficeFile
    ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(decodedUri || "")}`
    : decodedUri
      ? startPage > 1 && !decodedUri.includes("#page=")
        ? `${decodedUri}#page=${startPage}`
        : decodedUri
      : null;

  const missingDocument = !isResolving && !decodedUri;
  const showReaderDialog =
    offlineNoticeVisible || iframeError || missingDocument || Boolean(downloadError);
  const readerDialogTitle = missingDocument
    ? isOfficeFile
      ? "Internet connection required"
      : `${readerLabel} unavailable`
    : downloadError
      ? "Download failed"
      : "Unable to open document";
  const readerDialogMessage = missingDocument
    ? isOfficeFile
      ? "Office documents can only be read while online. Connect to the internet and try again."
      : "No document is available to open."
    : downloadError ?? "The document could not be opened. Please try again.";

  const closeReaderDialog = () => {
    setOfflineNoticeVisible(false);
    setIframeError(false);
    setDownloadError(null);
  };

  // Check if already downloaded
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
      if (isAlreadyDownloaded) {
        setDownloaded(true);
      }
    });
    return () => {
      active = false;
    };
  }, [decodedUri, rawUri, title]);

  const handleDownload = async () => {
    if (!decodedUri || downloading || downloaded) return;

    setDownloading(true);
    setDownloadProgress(0);

    try {
      const response = await fetch(decodedUri);
      if (!response.ok) throw new Error("Network response was not ok");

      const contentLength = response.headers.get("content-length");
      const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

      if (!response.body) {
        // Fallback for browsers without stream reader support
        const blob = await response.blob();
        await saveDownloadedFile({
          title: title || "PDF Document",
          uri: decodedUri,
          localUri: "",
          webBlob: blob,
          fileSize: blob.size,
        });
        setDownloaded(true);
        return;
      }

      const reader = response.body.getReader();
      let receivedBytes = 0;
      const chunks: Uint8Array[] = [];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          if (totalBytes > 0) {
            setDownloadProgress(receivedBytes / totalBytes);
          }
        }
      }

      const blob = new Blob(chunks as unknown as BlobPart[], {
        type: "application/octet-stream",
      });
      setDownloadProgress(1);
      await saveDownloadedFile({
        title: title || "PDF Document",
        uri: decodedUri,
        localUri: "",
        webBlob: blob,
        fileSize: blob.size,
      });
      setDownloaded(true);
    } catch (err) {
      console.warn("Web download error:", err);
      setDownloadError(
        "The file could not be downloaded. Check your connection and try again.",
      );
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
      }, 600);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: themeColors.background }]}>
      <ActionDialog
        visible={showReaderDialog}
        title={readerDialogTitle}
        message={readerDialogMessage}
        primaryText={missingDocument ? "Go back" : "OK"}
        onPrimary={missingDocument ? goBack : closeReaderDialog}
        onClose={missingDocument ? goBack : closeReaderDialog}
      />
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
          <Feather name="chevron-left" size={22} color={colors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {title || readerLabel}
          </Text>
        </View>

        <View style={styles.headerRightActions}>
          {/* Open in new tab button */}
          {decodedUri && (
            <Pressable
              style={[
                styles.headerAction,
                { backgroundColor: themeColors.lightBackground },
              ]}
              accessibilityLabel="Open in new tab"
              onPress={() => window.open(decodedUri, "_blank")}
            >
              <Feather name="external-link" size={18} color={colors.text} />
            </Pressable>
          )}

          {/* Download button with gradient background */}
          {decodedUri && (
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
          )}
        </View>
      </View>

      {/* ── Active File Download Progress Banner & Moving Bar ── */}
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
            <View
              style={[
                styles.downloadFill,
                { width: `${Math.round(downloadProgress * 100)}%` },
              ]}
            >
              <LinearGradient
                colors={["#006eff", "#6C63FF", "#A855F7"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </View>
        </View>
      )}

      {/* ── Content ── */}
      {isResolving ? (
        <View
          style={[styles.center, { backgroundColor: themeColors.background }]}
        >
          <Feather name="file-text" size={48} color={colors.primary} />
          <Text style={styles.errorTitle}>Loading PDF…</Text>
        </View>
      ) : isDocxFile && docxText === null && !iframeError ? (
        <View
          style={[styles.center, { backgroundColor: themeColors.background }]}
        >
          <Feather name="file-text" size={48} color={colors.primary} />
          <Text style={styles.errorTitle}>Loading document...</Text>
        </View>
      ) : isDocxFile && docxText !== null ? (
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
      ) : !decodedUri || iframeError ? (
        <View
          style={[styles.center, { backgroundColor: themeColors.background }]}
        >
          <Feather name="alert-circle" size={48} color="#CBD5E1" />
        </View>
      ) : (
        <iframe
          // Loading the signed resource URL directly lets the browser's PDF
          // viewer handle it. The previous pdf.js srcDoc implementation
          // fetched the file from a different origin, so CORS or a blocked
          // CDN was incorrectly reported to users as an offline error.
          src={viewerUri ?? undefined}
          title={title || readerLabel}
          style={{
            flex: 1,
            border: "none",
            width: "100%",
            height: "100%",
            backgroundColor: "#1A1A2E",
          }}
          onError={() => {
            setIframeError(true);
            setOfflineNoticeVisible(true);
          }}
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

  // Header
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerAction: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  downloadBtn: {
    borderRadius: radius.pill,
    overflow: "hidden",
    boxShadow: "0px 3px 8px rgba(108, 99, 255, 0.35)",
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
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: spacing.sm,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.primary,
    textTransform: "capitalize",
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
    position: "relative",
  },

  // Error / empty
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
