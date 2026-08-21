import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { colors, radius, spacing } from "../../constants/theme";
import {
  DownloadedFile,
  getDownloadedFiles,
  removeDownloadedFile,
} from "../../services/downloadService";
import { ActionDialog } from "../ui/ActionDialog";

export function DownloadedResources() {
  const router = useRouter();
  const [files, setFiles] = useState<DownloadedFile[]>([]);
  const [fileToDelete, setFileToDelete] = useState<DownloadedFile | null>(null);

  const loadFiles = useCallback(async () => {
    const list = await getDownloadedFiles();
    setFiles(list);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFiles();
    }, [loadFiles])
  );

  // If there are no items, hide the section completely!
  if (files.length === 0) {
    return null;
  }

  const handleOpenFile = (file: DownloadedFile) => {
    router.push({
      pathname: "/pdf-reader",
      params: {
        uri: encodeURIComponent(file.localUri),
        title: file.title,
      },
    });
  };

  const handleDeleteFile = (file: DownloadedFile) => {
    setFileToDelete(file);
  };

  const confirmDeleteFile = async () => {
    if (fileToDelete) {
      await removeDownloadedFile(fileToDelete.id);
      setFileToDelete(null);
      loadFiles();
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.sectionTitle}>My Downloads</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{files.length}</Text>
          </View>
        </View>
        <Text style={styles.sectionSubtitle}>Available offline anytime</Text>
      </View>

      {/* Files List */}
      <View style={styles.list}>
        {files.map((file) => (
          <Pressable
            key={file.id}
            style={({ pressed }) => [
              styles.fileCard,
              pressed && styles.fileCardPressed,
            ]}
            onPress={() => handleOpenFile(file)}
          >
            <View style={styles.fileIconWrapper}>
              <Feather name="file-text" size={22} color="#006eff" />
            </View>

            <View style={styles.fileDetails}>
              <Text style={styles.fileTitle} numberOfLines={1}>
                {file.title}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.offlineBadge}>
                  <Feather name="check-circle" size={10} color="#10B981" />
                  <Text style={styles.offlineText}>Offline</Text>
                </View>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.fileDate}>{formatDate(file.downloadedAt)}</Text>
              </View>
            </View>

            <View style={styles.actions}>
              <Pressable
                style={styles.openBtn}
                onPress={() => handleOpenFile(file)}
                accessibilityLabel="Open downloaded file"
              >
                <Text style={styles.openBtnText}>Open</Text>
              </Pressable>

              <Pressable
                style={styles.deleteBtn}
                onPress={() => handleDeleteFile(file)}
                accessibilityLabel="Delete downloaded file"
              >
                <Feather name="trash-2" size={16} color="#EF4444" />
              </Pressable>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Action Dialog for Delete Confirmation */}
      <ActionDialog
        visible={Boolean(fileToDelete)}
        title="Delete Download"
        message={`Are you sure you want to delete "${fileToDelete?.title}" from your offline downloads?`}
        primaryText="Delete"
        secondaryText="Cancel"
        primaryButtonColor="#EF4444"
        icon={<Feather name="trash-2" size={22} color="#EF4444" />}
        onPrimary={confirmDeleteFile}
        onSecondary={() => setFileToDelete(null)}
        onClose={() => setFileToDelete(null)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.subtitle,
    marginTop: 2,
  },
  list: {
    gap: 10,
    marginTop: spacing.xs,
  },
  fileCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    gap: 12,
  },
  fileCardPressed: {
    opacity: 0.9,
    backgroundColor: "#F8FAFC",
  },
  fileIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: "#EEF2FF",
    justifyContent: "center",
    alignItems: "center",
  },
  fileDetails: {
    flex: 1,
    gap: 4,
  },
  fileTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  offlineBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  offlineText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  metaDot: {
    fontSize: 12,
    color: "#94A3B8",
  },
  fileDate: {
    fontSize: 11,
    color: colors.subtitle,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  openBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.pill,
  },
  openBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  deleteBtn: {
    padding: 8,
    borderRadius: radius.pill,
    backgroundColor: "#FEF2F2",
  },
});
