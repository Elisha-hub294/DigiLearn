import { Feather as Icon } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import {
  listReports,
  ReportRecord,
  retryReport,
} from "../services/reportService";

const dateLabel = (value?: { seconds?: number }) =>
  value?.seconds
    ? new Date(value.seconds * 1000).toLocaleString()
    : "Unknown date";

export default function AdminReportsScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [reports, setReports] = useState<ReportRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (profile?.type !== "admin") return;
      isRefresh ? setRefreshing(true) : setLoading(true);
      setError(null);
      try {
        setReports(await listReports());
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

  const retry = async (reportId: string) => {
    setRetryingId(reportId);
    setError(null);
    try {
      await retryReport(reportId);
      await load(true);
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to retry report.",
      );
    } finally {
      setRetryingId(null);
    }
  };

  if (profile?.type !== "admin") return null;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
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
          Review reported content and monitor email delivery.
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {loading || refreshing ? (
          <ActivityIndicator color={colors.primary} style={styles.loader} />
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
                  report.status === "failed" && styles.failed,
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
            {report.lastError ? (
              <Text style={styles.error}>{report.lastError}</Text>
            ) : null}
            {report.status === "failed" ? (
              <Pressable
                onPress={() => void retry(report.id)}
                disabled={retryingId === report.id}
                style={styles.retryButton}
              >
                {retryingId === report.id ? (
                  <ActivityIndicator color={colors.white} size="small" />
                ) : (
                  <Text style={styles.retryText}>Retry email</Text>
                )}
              </Pressable>
            ) : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F7F9FC" },
  container: { padding: spacing.lg, paddingBottom: 40 },
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
  failed: { color: "#991B1B", backgroundColor: "#FEE2E2" },
  body: { color: "#334155", fontSize: 13, lineHeight: 19, marginTop: 10 },
  error: { color: "#B42318", fontSize: 12, marginTop: 8 },
  retryButton: {
    alignSelf: "flex-start",
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 12,
  },
  retryText: { color: colors.white, fontSize: 12, fontWeight: "700" },
});
