import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { radius, spacing } from "../../constants/theme";
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
import {
  extractDocxText,
  extractPptxContent,
} from "../library/add-item/pdfService";
import { ActionDialog } from "../ui/ActionDialog";

const PDF_JS_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.min.js";
const PDF_WORKER_CDN =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js";

/** Load PDF.js once, even when a preview component loaded it before the reader. */
function loadPdfJs(): Promise<any> {
  if ((window as any).pdfjsLib)
    return Promise.resolve((window as any).pdfjsLib);

  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${PDF_JS_CDN}"]`,
    );
    const onLoad = () => {
      const pdfjsLib = (window as any).pdfjsLib;
      if (!pdfjsLib) {
        reject(new Error("PDF.js did not initialise"));
        return;
      }
      pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_CDN;
      resolve(pdfjsLib);
    };

    if (existing) {
      existing.addEventListener("load", onLoad, { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load PDF.js")),
        {
          once: true,
        },
      );
      return;
    }

    const script = document.createElement("script");
    script.src = PDF_JS_CDN;
    script.onload = onLoad;
    script.onerror = () => reject(new Error("Failed to load PDF.js"));
    document.head.appendChild(script);
  });
}

function WebPdfPage({
  pdf,
  pageNumber,
  onVisible,
  setCanvasRef,
}: {
  pdf: any;
  pageNumber: number;
  onVisible: (page: number) => void;
  setCanvasRef: (canvas: HTMLCanvasElement | null) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let active = true;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) onVisible(pageNumber);
      },
      { threshold: 0.5 },
    );
    observer.observe(canvas);

    void (async () => {
      const page = await pdf.getPage(pageNumber);
      if (!active) return;
      const viewport = page.getViewport({ scale: 1.5 });
      const context = canvas.getContext("2d");
      if (!context) return;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: context, viewport }).promise;
    })();

    return () => {
      active = false;
      observer.disconnect();
    };
  }, [onVisible, pageNumber, pdf]);

  return (
    <canvas
      ref={(canvas) => {
        canvasRef.current = canvas;
        setCanvasRef(canvas);
      }}
      style={{
        display: "block",
        width: "100%",
        height: "auto",
        marginBottom: 8,
        backgroundColor: "transparent",
      }}
    />
  );
}

function WebPdfReader({
  uri,
  initialPage,
  onLoaded,
  onPageChange,
  onError,
}: {
  uri: string;
  initialPage: number;
  onLoaded: (pageCount: number) => void;
  onPageChange: (page: number) => void;
  onError: () => void;
}) {
  const [pdf, setPdf] = useState<any>(null);
  const pageRefs = useRef<Record<number, HTMLCanvasElement | null>>({});

  useEffect(() => {
    let active = true;
    void loadPdfJs()
      .then(
        (pdfjsLib) =>
          pdfjsLib.getDocument({ url: uri, withCredentials: false }).promise,
      )
      .then((document) => {
        if (!active) return;
        setPdf(document);
        onLoaded(document.numPages);
      })
      .catch(() => {
        if (active) onError();
      });
    return () => {
      active = false;
    };
  }, [onError, onLoaded, uri]);

  useEffect(() => {
    if (!pdf || initialPage <= 1) return;
    const timer = window.setTimeout(() => {
      pageRefs.current[initialPage]?.scrollIntoView({ block: "start" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [initialPage, pdf]);

  if (!pdf) return null;
  return (
    <ScrollView
      style={styles.pdfScroll}
      contentContainerStyle={styles.pdfContent}
    >
      {Array.from({ length: pdf.numPages }, (_, index) => (
        <WebPdfPage
          key={index + 1}
          pdf={pdf}
          pageNumber={index + 1}
          onVisible={onPageChange}
          setCanvasRef={(canvas) => {
            pageRefs.current[index + 1] = canvas;
          }}
        />
      ))}
    </ScrollView>
  );
}

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
    fileType,
  } = useLocalSearchParams<{
    uri?: string;
    document?: string;
    pageId?: string;
    title?: string;
    initialPage?: string;
    fileType?: string;
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
  const [officeText, setOfficeText] = useState<string | null>(null);
  const [officeImages, setOfficeImages] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);

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
  // Blob URLs used for web downloads do not include their original filename.
  // The Downloads screen supplies the persisted source extension so a cached
  // Office document types are not mistaken for a PDF.
  const requestedFileType =
    typeof fileType === "string" && /^(pdf|docx|pptx|ppt)$/i.test(fileType)
      ? fileType.toLowerCase()
      : null;
  const fileExtension = requestedFileType ?? getFileExtension(decodedUri);
  const isOfficeFile = ["docx", "ppt", "pptx"].includes(fileExtension);
  const isDocxFile = fileExtension === "docx";
  const isPptxFile = fileExtension === "pptx";
  const isTextOfficeFile = isDocxFile || isPptxFile;

  useEffect(() => {
    if (!isTextOfficeFile || !decodedUri) return;

    let active = true;
    const loadOfficeText = async () => {
      setOfficeText(null);
      setOfficeImages([]);
      try {
        const response = await fetch(decodedUri);
        if (!response.ok)
          throw new Error(`Office document request failed: ${response.status}`);
        const data = await response.arrayBuffer();
        const content = isDocxFile
          ? { text: await extractDocxText(data), images: [] }
          : await extractPptxContent(data);
        if (active) {
          setOfficeText(content.text);
          setOfficeImages(content.images);
        }
      } catch (error) {
        console.warn("Failed to open Office document:", error);
        if (active) setIframeError(true);
      }
    };

    void loadOfficeText();
    return () => {
      active = false;
    };
  }, [decodedUri, isDocxFile, isTextOfficeFile]);

  useEffect(() => {
    if (pageId) void recordPageVisit(pageId);
  }, [pageId]);

  useEffect(() => {
    let active = true;
    const initializeProgress = async () => {
      if (!pageId) {
        setProgressReady(true);
        return;
      }

      setProgressReady(false);
      if (initialPage) {
        const page = parseInt(initialPage, 10);
        if (!isNaN(page) && page > 0) setCurrentPage(page);
        setProgressReady(true);
        return;
      }

      const prog = await getPageReadingProgress(pageId);
      if (!active) return;
      if (prog && prog.lastPage > 1) {
        setStartPage(prog.lastPage);
        setCurrentPage(prog.lastPage);
      }
      setProgressReady(true);
    };

    void initializeProgress();
    return () => {
      active = false;
    };
  }, [pageId, initialPage]);

  useEffect(() => {
    if (!progressReady || !pageId || !decodedUri || isOfficeFile) return;

    void savePageReadingProgress(pageId, currentPage, totalPages || undefined, {
      title: title || "PDF",
      documentUri: decodedUri,
    });
  }, [
    currentPage,
    decodedUri,
    isOfficeFile,
    pageId,
    progressReady,
    title,
    totalPages,
  ]);

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
    offlineNoticeVisible ||
    iframeError ||
    missingDocument ||
    Boolean(downloadError);
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
    : (downloadError ?? "The document could not be opened. Please try again.");

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
        // The browser PDF viewer relies on this MIME type when the cached
        // file is later opened from IndexedDB via a blob URL.
        type: response.headers.get("content-type") || "application/pdf",
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

  const handlePdfLoaded = useCallback((pageCount: number) => {
    setTotalPages(pageCount);
  }, []);

  const handlePdfPageChange = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const handlePdfError = useCallback(() => {
    setIframeError(true);
    setOfflineNoticeVisible(true);
  }, []);

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
          <Feather name="chevron-left" size={22} color={themeColors.text} />
        </Pressable>

        <View style={styles.headerCenter}>
          <Text
            style={[styles.headerTitle, { color: themeColors.primary }]}
            numberOfLines={1}
          >
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
              <Feather
                name="external-link"
                size={18}
                color={themeColors.text}
              />
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
          <Feather name="file-text" size={48} color={themeColors.inactive} />
          <Text style={[styles.errorTitle, { color: themeColors.text }]}>
            Loading PDF…
          </Text>
        </View>
      ) : isTextOfficeFile && officeText === null && !iframeError ? (
        <View
          style={[styles.center, { backgroundColor: themeColors.background }]}
        >
          <Feather name="file-text" size={48} color={themeColors.inactive} />
          <Text style={[styles.errorTitle, { color: themeColors.text }]}>
            Loading document...
          </Text>
        </View>
      ) : isTextOfficeFile && officeText !== null ? (
        <ScrollView
          style={[
            styles.docxContent,
            { backgroundColor: themeColors.background },
          ]}
          contentContainerStyle={styles.docxContentContainer}
        >
          {officeText.split("\n").map((paragraph, index) => (
            <Text
              key={`${index}-${paragraph.slice(0, 12)}`}
              style={[styles.docxParagraph, { color: themeColors.text }]}
            >
              {paragraph || " "}
            </Text>
          ))}
          {isPptxFile &&
            officeImages.map((imageUri, index) => (
              <Image
                key={`pptx-image-${index}`}
                source={{ uri: imageUri }}
                style={styles.pptxImage}
                resizeMode="contain"
                accessibilityLabel={`Presentation image ${index + 1}`}
              />
            ))}
        </ScrollView>
      ) : !decodedUri || iframeError ? (
        <View
          style={[styles.center, { backgroundColor: themeColors.background }]}
        >
          <Feather name="alert-circle" size={48} color={themeColors.inactive} />
        </View>
      ) : isOfficeFile ? (
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
            backgroundColor: themeColors.background,
          }}
          onError={() => {
            setIframeError(true);
            setOfflineNoticeVisible(true);
          }}
        />
      ) : (
        <WebPdfReader
          uri={decodedUri}
          initialPage={startPage}
          onLoaded={handlePdfLoaded}
          onPageChange={handlePdfPageChange}
          onError={handlePdfError}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  docxContent: {
    flex: 1,
  },
  docxContentContainer: {
    padding: spacing.lg,
  },
  docxParagraph: {
    fontSize: 16,
    lineHeight: 25,
    marginBottom: spacing.md,
  },
  pptxImage: {
    width: "100%",
    height: 260,
    marginBottom: spacing.lg,
  },
  pdfScroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  pdfContent: {
    alignItems: "center",
    paddingVertical: 8,
  },

  // Header
  header: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  headerBack: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
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
    textTransform: "capitalize",
  },

  // Download Progress Banner
  downloadProgressBanner: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
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
  },
  downloadTrack: {
    height: 4,
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
  },
  errorTitle: {
    fontSize: 17,
    fontWeight: "700",
  },
  errorText: {
    fontSize: 13,
    textAlign: "center",
  },
  backBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: radius.pill,
  },
  backBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
