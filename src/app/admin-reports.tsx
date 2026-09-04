import { Feather as Icon } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Skeleton } from "../components/ui/Skeleton";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import {
  listReports,
  ReportRecord,
  updateReport,
} from "../services/reportService";

const dateLabel = (value?: { seconds?: number }) =>
  value?.seconds
    ? new Date(value.seconds * 1000).toLocaleString()
    : "Unknown date";

export default function AdminReportsScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const maxWidth = Math.min(1100, width - horizontalPadding * 2);
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = useCallback(
    async (isRefresh = false) => {
      if (profile?.type !== "admin") return;
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const page = await listReports();
        setReports(page.reports);
      } catch (reason) {
        setError(
          reason instanceof Error ? reason.message : "Unable to load reports.",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [profile?.type],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const saveReport = async (
    report: ReportRecord,
    status: ReportRecord["status"],
  ) => {
    setSavingId(report.id);
    setError(null);
    try {
      await updateReport(
        report.id,
        status,
        notes[report.id] ?? report.adminNotes ?? "",
      );
      setReports((current) =>
        current.map((entry) =>
          entry.id === report.id
            ? {
                ...entry,
                status,
                adminNotes: notes[report.id] ?? entry.adminNotes,
              }
            : entry,
        ),
      );
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to update report.",
      );
    } finally {
      setSavingId(null);
    }
  };

  if (profile?.type !== "admin") return null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={[styles.contentContainer, { maxWidth }]}>
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { paddingHorizontal: horizontalPadding },
            ]}
            style={styles.scroll}
          >
            <View style={styles.header}>
              <Pressable
                onPress={() => router.replace("/settings" as never)}
                accessibilityLabel="Back to settings"
                style={styles.iconButton}
              >
                <Icon name="arrow-left" size={22} color={colors.dark} />
              </Pressable>
              <View style={styles.heading}>
                <Text style={styles.eyebrow}>ADMIN TOOLS</Text>
                <Text style={styles.title}>Resource reports</Text>
              </View>
              <Pressable
                onPress={() => void load(true)}
                accessibilityLabel="Refresh reports"
                style={styles.iconButton}
              >
                <Icon name="refresh-cw" size={18} color={colors.primary} />
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              Review, track, and resolve reported content.
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            {loading || refreshing ? (
              <View
                style={styles.skeletonList}
                accessibilityLabel="Loading reports"
              >
                {[0, 1, 2].map((item) => (
                  <View key={item} style={styles.skeletonReport}>
                    <View style={styles.skeletonReportCopy}>
                      <Skeleton style={styles.skeletonTitle} />
                      <Skeleton style={styles.skeletonLine} />
                    </View>
                    <Skeleton style={styles.skeletonStatus} />
                  </View>
                ))}
              </View>
            ) : null}
            {!loading && !reports.length ? (
              <Text style={styles.empty}>No reports yet.</Text>
            ) : null}
            {reports.map((report) => (
              <View key={report.id} style={styles.report}>
                <View style={styles.reportHeader}>
                  <View style={styles.reportTitleWrap}>
                    <Text style={styles.reportTitle}>{report.item.name}</Text>
                    <Text style={styles.meta}>
                      {report.item.type} · {dateLabel(report.createdAt)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.status,
                      report.status === "resolved" && styles.resolved,
                      report.status === "dismissed" && styles.dismissed,
                    ]}
                  >
                    {report.status}
                  </Text>
                </View>
                <Text style={styles.body}>
                  Problems: {report.reasons?.join(", ") || "None selected"}
                </Text>
                <Text style={styles.body}>
                  {report.details || "No written details."}
                </Text>
                <Text style={styles.meta}>
                  By {report.username} · {report.userEmail}
                </Text>
                <Text style={styles.meta}>
                  Item ID: {report.item.id} · User ID: {report.userId}
                </Text>
                <View style={styles.statusActions}>
                  {(
                    [
                      "new",
                      "in_review",
                      "resolved",
                      "dismissed",
                    ] as ReportRecord["status"][]
                  ).map((status) => (
                    <Pressable
                      key={status}
                      onPress={() => void saveReport(report, status)}
                      disabled={savingId === report.id}
                      style={[
                        styles.statusButton,
                        report.status === status && styles.statusButtonSelected,
                      ]}
                    >
                      <Text style={styles.statusButtonText}>
                        {status.replace("_", " ")}
                      </Text>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  value={notes[report.id] ?? report.adminNotes ?? ""}
                  onChangeText={(value) =>
                    setNotes((current) => ({ ...current, [report.id]: value }))
                  }
                  placeholder="Add an internal admin note"
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={2000}
                  style={styles.notesInput}
                />
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FC" },
  page: { flex: 1, alignItems: "center" },
  contentContainer: { flex: 1, width: "100%" },
  scroll: { flex: 1, width: "100%" },
  container: { paddingTop: spacing.lg, paddingBottom: 40 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  heading: { flex: 1 },
  iconButton: { padding: 8 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: { color: colors.dark, fontSize: 25, fontWeight: "800", marginTop: 3 },
  subtitle: {
    color: colors.subtitle,
    fontSize: 14,
    marginTop: 12,
    marginBottom: 18,
  },
  loader: { marginVertical: 18 },
  skeletonList: { marginTop: 18, gap: 10 },
  skeletonReport: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  skeletonReportCopy: { flex: 1, gap: 8 },
  skeletonTitle: { width: "58%", height: 14 },
  skeletonLine: { width: "82%", height: 11 },
  skeletonStatus: { width: 72, height: 24, borderRadius: 12 },
  empty: { color: colors.subtitle, textAlign: "center", marginTop: 32 },
  report: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  reportHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  reportTitleWrap: { flex: 1 },
  reportTitle: { color: colors.dark, fontSize: 16, fontWeight: "700" },
  meta: { color: colors.subtitle, fontSize: 11, marginTop: 5 },
  status: {
    color: "#166534",
    backgroundColor: "#DCFCE7",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: "700",
  },
  resolved: { color: "#166534", backgroundColor: "#DCFCE7" },
  dismissed: { color: "#475569", backgroundColor: "#E2E8F0" },
  body: { color: "#334155", fontSize: 13, lineHeight: 19, marginTop: 10 },
  error: { color: "#B42318", fontSize: 12, marginTop: 8 },
  statusActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 14,
  },
  statusButton: {
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  statusButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EAF2FF",
  },
  statusButtonText: { color: "#334155", fontSize: 11, fontWeight: "600" },
  notesInput: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 9,
    padding: 9,
    marginTop: 10,
    color: colors.dark,
    fontSize: 12,
  },
});
