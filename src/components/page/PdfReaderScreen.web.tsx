import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";
import { saveDownloadedFile } from "../../services/downloadService";

export function PdfReaderScreen() {
  const { uri, title } = useLocalSearchParams<{
    uri: string;
    title?: string;
  }>();
  const [iframeError, setIframeError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const goBack = () => {
    if (router.canGoBack()) router.back();
  };

  const decodedUri = uri ? decodeURIComponent(uri as string) : null;

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
        type: "application/pdf",
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
      const a = document.createElement("a");
      a.href = decodedUri;
      a.download =
        (title ? title.replace(/[^a-zA-Z0-9_\- ]/g, "") : "document") + ".pdf";
      a.target = "_blank";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setTimeout(() => {
        setDownloading(false);
        setDownloadProgress(0);
      }, 600);
    }
  };

  const triggerBlobDownload = (blob: Blob) => {
    const fileName =
      (title ? title.replace(/[^a-zA-Z0-9_\- ]/g, "") : "document") + ".pdf";
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
            {title || "PDF Reader"}
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
      {!decodedUri || iframeError ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={48} color="#CBD5E1" />
          <Text style={styles.errorTitle}>PDF unavailable</Text>
          <Text style={styles.errorText}>
            The document could not be displayed.
          </Text>
          <Pressable style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backBtnText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        // Browsers natively render PDFs in iframes — no external viewer needed
        <iframe
          src={decodedUri}
          title={title || "PDF Reader"}
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
