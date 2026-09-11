import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActionDialog } from "../components/ui/ActionDialog";
import { Skeleton } from "../components/ui/Skeleton";
import { getHorizontalPadding } from "../constants/layout";
import { colors, radius, spacing } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";
import {
  clearAllDownloadedFiles,
  DownloadedFile,
  getDownloadedFiles,
  removeDownloadedFile,
} from "../services/downloadService";

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "Offline file";
  const kb = bytes / 1024;
  if (kb < 1024) return `${Math.round(kb)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function formatDate(timestamp: number): string {
  if (!timestamp) return "Recently";
  const d = new Date(timestamp);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function DownloadsScreen() {
  const router = useRouter();
  const { colors: themeColors } = useTheme();
  const { width } = useWindowDimensions();
  const [files, setFiles] = useState<DownloadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [fileToDelete, setFileToDelete] = useState<DownloadedFile | null>(null);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  const loadFiles = useCallback(async () => {
    try {
      const list = await getDownloadedFiles();
      setFiles(list);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      void loadFiles();
    }, [loadFiles]),
  );

  const handleRefresh = () => {
    setRefreshing(true);
    void loadFiles();
  };

  const filteredFiles = useMemo(() => {
    if (!searchQuery.trim()) return files;
    const q = searchQuery.toLowerCase();
    return files.filter((f) => f.title.toLowerCase().includes(q));
  }, [files, searchQuery]);

  const totalStorageBytes = useMemo(() => {
    return files.reduce((acc, f) => acc + (f.fileSize || 0), 0);
  }, [files]);

  const handleOpenFile = (file: DownloadedFile) => {
    router.push({
      pathname: "/pdf-reader",
      params: {
        uri: encodeURIComponent(file.localUri),
        title: file.title,
        uniqueName: file.uniqueName,
        fileType:
          file.uri.split("?")[0].match(/\.(pdf|docx|pptx|ppt)$/i)?.[1] ?? "pdf",
      },
    });
  };

  const confirmDeleteFile = async () => {
    if (fileToDelete) {
      await removeDownloadedFile(fileToDelete.id);
      setFiles((prev) => prev.filter((f) => f.id !== fileToDelete.id));
      setFileToDelete(null);
    }
  };

  const confirmClearAll = async () => {
    await clearAllDownloadedFiles();
    setFiles([]);
    setShowClearAllDialog(false);
  };

  const horizontalPadding = getHorizontalPadding(width);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: horizontalPadding }]}>
        <Pressable
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace("/library")
          }
          style={[styles.backBtn, { backgroundColor: themeColors.surface }]}
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={20} color={themeColors.text} />
        </Pressable>
        <View style={styles.headerTitles}>
          <Text style={[styles.headerTitle, { color: themeColors.text }]}>
            Offline Downloads
          </Text>
          <Text style={[styles.headerSub, { color: themeColors.subtitle }]}>
            {files.length} {files.length === 1 ? "file" : "files"} •{" "}
            {formatFileSize(totalStorageBytes)}
          </Text>
        </View>

        {files.length > 0 && (
          <Pressable
            onPress={() => setShowClearAllDialog(true)}
            style={[
              styles.clearAllBtn,
              { backgroundColor: themeColors.dangerBackground },
            ]}
          >
            <Feather name="trash-2" size={16} color={themeColors.danger} />
            <Text style={styles.clearAllText}>Clear All</Text>
          </Pressable>
        )}
      </View>

      {/* Search Filter */}
      {files.length > 0 && (
        <View
          style={[
            styles.searchBoxWrapper,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: themeColors.surface,
                borderColor: themeColors.surfaceBorder,
              },
            ]}
          >
            <Feather name="search" size={18} color={themeColors.subtitle} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search downloaded lessons & papers..."
              placeholderTextColor={themeColors.subtitle}
              style={[styles.searchInput, { color: themeColors.text }]}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Feather name="x" size={16} color={themeColors.subtitle} />
              </Pressable>
            )}
          </View>
        </View>
      )}

      {/* Main Content */}
      {loading ? (
        <View
          style={[
            styles.listContainer,
            { paddingHorizontal: horizontalPadding },
          ]}
        >
          {[1, 2, 3, 4].map((i) => (
            <View
              key={i}
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.white,
                  borderColor: themeColors.surfaceBorder,
                },
              ]}
            >
              <Skeleton style={styles.skeletonIcon} />
              <View style={styles.cardContent}>
                <Skeleton
                  style={{ width: "80%", height: 16, marginBottom: 8 }}
                />
                <Skeleton style={{ width: "40%", height: 12 }} />
              </View>
            </View>
          ))}
        </View>
      ) : filteredFiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View
            style={[
              styles.emptyIconCircle,
              { backgroundColor: themeColors.surface },
            ]}
          >
            <Feather name="download-cloud" size={40} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: themeColors.text }]}>
            {searchQuery ? "No matches found" : "No downloads yet"}
          </Text>
          <Text style={[styles.emptySubtitle, { color: themeColors.subtitle }]}>
            {searchQuery
              ? `No downloaded files matched "${searchQuery}"`
              : "Download revision papers, books, and notes to access them anytime without internet connection."}
          </Text>
          {!searchQuery && (
            <Pressable
              onPress={() => router.push("/library")}
              style={[styles.browseBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.browseBtnText}>Browse Library</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredFiles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            { paddingHorizontal: horizontalPadding },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInUp.delay(index * 40).duration(300)}
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.white,
                  borderColor: themeColors.surfaceBorder,
                },
              ]}
            >
              <Pressable
                onPress={() => handleOpenFile(item)}
                style={styles.cardMain}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.title}`}
              >
                <View
                  style={[
                    styles.fileIconWrap,
                    { backgroundColor: themeColors.primaryLight },
                  ]}
                >
                  <Feather name="file-text" size={24} color={colors.primary} />
                </View>

                <View style={styles.cardContent}>
                  <Text
                    style={[styles.fileTitle, { color: themeColors.text }]}
                    numberOfLines={2}
                  >
                    {item.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <View style={styles.badgeOffline}>
                      <Feather name="check-circle" size={11} color="#16A34A" />
                      <Text style={styles.badgeOfflineText}>Offline</Text>
                    </View>
                    <Text
                      style={[styles.metaDot, { color: themeColors.subtitle }]}
                    >
                      •
                    </Text>
                    <Text
                      style={[styles.metaText, { color: themeColors.subtitle }]}
                    >
                      {formatFileSize(item.fileSize)}
                    </Text>
                    <Text
                      style={[styles.metaDot, { color: themeColors.subtitle }]}
                    >
                      •
                    </Text>
                    <Text
                      style={[styles.metaText, { color: themeColors.subtitle }]}
                    >
                      {formatDate(item.downloadedAt)}
                    </Text>
                  </View>
                </View>
              </Pressable>

              <Pressable
                onPress={() => setFileToDelete(item)}
                style={styles.deleteBtn}
                accessibilityLabel={`Delete ${item.title}`}
              >
                <Feather name="trash-2" size={18} color="#EF4444" />
              </Pressable>
            </Animated.View>
          )}
        />
      )}

      {/* Delete Single Dialog */}
      <ActionDialog
        visible={Boolean(fileToDelete)}
        title="Delete Download"
        message={`Are you sure you want to remove "${fileToDelete?.title}" from your offline storage?`}
        primaryText="Delete"
        secondaryText="Cancel"
        onPrimary={confirmDeleteFile}
        onSecondary={() => setFileToDelete(null)}
        onClose={() => setFileToDelete(null)}
      />

      {/* Clear All Dialog */}
      <ActionDialog
        visible={showClearAllDialog}
        title="Clear All Downloads"
        message="This will remove all downloaded files from your device. You can download them again whenever you have an internet connection."
        primaryText="Clear All"
        secondaryText="Cancel"
        onPrimary={confirmClearAll}
        onSecondary={() => setShowClearAllDialog(false)}
        onClose={() => setShowClearAllDialog(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitles: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
  },
  headerSub: {
    fontSize: 12,
    marginTop: 2,
  },
  clearAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  clearAllText: {
    color: "#DC2626",
    fontSize: 12,
    fontWeight: "700",
  },
  searchBoxWrapper: {
    marginBottom: spacing.sm,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 44,
    gap: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    height: "100%",
  },
  listContainer: {
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  cardMain: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  fileIconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  fileTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
    gap: 4,
  },
  badgeOffline: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  badgeOfflineText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16A34A",
  },
  metaDot: {
    fontSize: 11,
  },
  metaText: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: spacing.sm,
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  browseBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  browseBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
});
