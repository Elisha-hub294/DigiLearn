import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";
import { recordPageVisit } from "../../services/activityService";
import {
  getDownloadedFiles,
  saveDownloadedFile,
} from "../../services/downloadService";

import { useFirebaseStorageUrl } from "../../utils/firebaseStorage";

function normalizeUriParam(
  raw: string | string[] | undefined | null,
): string | null {
  if (!raw) return null;
  const str = Array.isArray(raw) ? raw[0] : raw;
  if (!str) return null;
  let result = str.trim();
  if (
    result.startsWith("http%3A") ||
    result.startsWith("https%3A") ||
    result.startsWith("file%3A") ||
    result.startsWith("%2F")
  ) {
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
  const {
    uri,
    document: pdfDocument,
    pageId,
    title,
  } = useLocalSearchParams<{
    uri?: string;
    document?: string;
    pageId?: string;
    title?: string;
  }>();
  const [iframeError, setIframeError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const goBack = () => {
    if (router.canGoBack()) router.back();
  };

  const rawUri = normalizeUriParam(uri ?? pdfDocument);
  const resolvedUri = useFirebaseStorageUrl(rawUri ?? undefined);
  // While the hook is resolving, resolvedUri is undefined — don't fall back to the raw path
  const decodedUri = resolvedUri ?? null;
  const isResolving = rawUri != null && decodedUri == null;
  const fileExtension = getFileExtension(decodedUri);
  const isOfficeFile = ["docx", "ppt", "pptx"].includes(fileExtension);
  useEffect(() => {
    if (pageId) void recordPageVisit(pageId);
  }, [pageId]);
  const readerLabel = isOfficeFile ? "Office Reader" : "PDF Reader";
  const viewerUri = isOfficeFile
    ? `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(decodedUri || "")}`
    : decodedUri;

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
        triggerBlobDownload(blob);
        await saveDownloadedFile({
          title: title || "PDF Document",
          uri: decodedUri,
          localUri: decodedUri,
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
      triggerBlobDownload(blob);
      await saveDownloadedFile({
        title: title || "PDF Document",
        uri: decodedUri,
        localUri: decodedUri,
      });
      setDownloaded(true);
    } catch (err) {
      console.warn("Web download error, falling back to direct link:", err);
      let downloadUrl = decodedUri;
      if (
        downloadUrl.includes("firebasestorage.googleapis.com") ||
        downloadUrl.includes(".firebasestorage.app") ||
        downloadUrl.includes(".appspot.com")
      ) {
        const separator = downloadUrl.includes("?") ? "&" : "?";
        const safeTitle =
          (title
            ? title.trim().replace(/[^a-zA-Z0-9_\- ]/g, "")
            : "document") || "document";
        downloadUrl = `${downloadUrl}${separator}response-content-disposition=attachment%3Bfilename%3D%22${encodeURIComponent(safeTitle)}.${fileExtension}%22`;
      }

      // Trigger direct download via hidden iframe without opening a new tab
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      iframe.src = downloadUrl;
      document.body.appendChild(iframe);
      setTimeout(() => {
        try {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        } catch {}
      }, 6000);

      try {
        await saveDownloadedFile({
          title: title || "PDF Document",
          uri: decodedUri,
          localUri: decodedUri,
        });
        setDownloaded(true);
      } catch (saveErr) {
        console.warn("Failed to register download in-app:", saveErr);
      }
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
      }, 600);
    }
  };

  const triggerBlobDownload = (blob: Blob) => {
    const fileName =
      (title ? title.replace(/[^a-zA-Z0-9_\- ]/g, "") : "document") +
      `.${fileExtension}`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <Pressable
          style={styles.headerBack}
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
              style={styles.headerAction}
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
        <View style={styles.downloadProgressBanner}>
          <View style={styles.downloadProgressInfo}>
            <Feather name="download-cloud" size={16} color="#006eff" />
            <Text style={styles.downloadProgressLabel}>
              Downloading file… {Math.round(downloadProgress * 100)}%
            </Text>
          </View>
          <View style={styles.downloadTrack}>
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
        <View style={styles.center}>
          <Feather name="file-text" size={48} color={colors.primary} />
          <Text style={styles.errorTitle}>Loading PDF…</Text>
        </View>
      ) : !decodedUri || iframeError ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color="#CBD5E1" />
          <Text style={styles.errorTitle}>{readerLabel} unavailable</Text>
          <Text style={styles.errorText}>
            The document could not be displayed.
          </Text>
          <Pressable style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <iframe
          src={viewerUri ?? undefined}
          title={title || readerLabel}
          style={{
            flex: 1,
            border: "none",
            width: "100%",
            height: "100%",
            backgroundColor: "#1A1A2E",
          }}
          onError={() => setIframeError(true)}
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
