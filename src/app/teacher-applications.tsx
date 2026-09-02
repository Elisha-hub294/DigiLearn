import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import { colors, radius, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import { reviewTeacherApplication } from "../services/teacherApplications";

type Application = {
  id: string;
  name?: string;
  email?: string;
  school?: string;
  subjects?: string[];
  status?: string;
};
type Filter = "all" | "pending" | "approved" | "rejected";
type AuditEntry = {
  id: string;
  applicationId?: string;
  action?: string;
  reason?: string;
  createdAt?: unknown;
};

const paddingFor = (width: number) =>
  width >= 1200
    ? 150
    : width >= 900
      ? 50
      : width >= 600
        ? 30
        : width >= 400
          ? 5
          : 3;

export default function TeacherApplicationsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const [applications, setApplications] = useState<Application[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [rejecting, setRejecting] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (profile?.type !== "admin") return;
    return onSnapshot(collection(db, "teacherApplications"), (snapshot) => {
      setApplications(
        snapshot.docs.map(
          (item) => ({ id: item.id, ...item.data() }) as Application,
        ),
      );
    });
  }, [profile?.type]);

  useEffect(() => {
    if (profile?.type !== "admin") return;
    return onSnapshot(collection(db, "teacherApplicationAudit"), (snapshot) => {
      setAudit(
        snapshot.docs.map(
          (item) => ({ id: item.id, ...item.data() }) as AuditEntry,
        ),
      );
    });
  }, [profile?.type]);

  const review = async (
    application: Application,
    decision: "approve" | "reject",
    reason = "",
  ) => {
    setBusyId(application.id);
    try {
      await reviewTeacherApplication(application.id, decision, reason);
      setRejecting(null);
      setRejectionReason("");
    } catch (error) {
      console.error("Failed to review teacher application:", error);
    } finally {
      setBusyId(null);
    }
  };

  if (profile?.type !== "admin") return null;

  const padding = paddingFor(width);
  const maxWidth = Math.min(1100, width - padding * 2);
  const visibleApplications = applications.filter(
    (item) => filter === "all" || item.status === filter,
  );
  const counts = {
    all: applications.length,
    pending: applications.filter((item) => item.status === "pending").length,
    approved: applications.filter((item) => item.status === "approved").length,
    rejected: applications.filter((item) => item.status === "rejected").length,
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.header, { paddingHorizontal: padding, maxWidth }]}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Feather name="arrow-left" size={22} color={colors.text} />
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>ADMIN REVIEW</Text>
          <Text style={styles.title}>Teacher applications</Text>
        </View>
      </View>
      <View
        style={[styles.dashboard, { paddingHorizontal: padding, maxWidth }]}
      >
        {(Object.keys(counts) as Filter[]).map((item) => (
          <Pressable
            key={item}
            onPress={() => setFilter(item)}
            style={[styles.metric, filter === item && styles.metricActive]}
          >
            <Text
              style={[
                styles.metricValue,
                filter === item && styles.metricValueActive,
              ]}
            >
              {counts[item]}
            </Text>
            <Text
              style={[
                styles.metricLabel,
                filter === item && styles.metricLabelActive,
              ]}
            >
              {item[0].toUpperCase() + item.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={visibleApplications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingHorizontal: padding, maxWidth },
        ]}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="check-circle" size={34} color={colors.green} />
            <Text style={styles.emptyTitle}>
              {filter === "pending" ? "All caught up" : "No applications found"}
            </Text>
            <Text style={styles.emptyText}>
              There are no teacher applications waiting for review.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.name || "T").slice(0, 1).toUpperCase()}
                </Text>
              </View>
              <Pressable
                style={styles.viewButton}
                onPress={() =>
                  router.push({
                    pathname: "/teacher-application-review",
                    params: { applicationId: item.id },
                  } as never)
                }
              >
                <Feather
                  name="arrow-up-right"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.viewButtonText}>Review details</Text>
              </Pressable>
              <View style={styles.identity}>
                <Text style={styles.name}>
                  {item.name || "Unnamed applicant"}
                </Text>
                <Text style={styles.email}>
                  {item.email || "No email provided"}
                </Text>
              </View>
              <View style={styles.pending}>
                <Text style={styles.pendingText}>PENDING</Text>
              </View>
            </View>
            {!!item.school && <Text style={styles.detail}>{item.school}</Text>}
            {!!item.subjects?.length && (
              <Text style={styles.detail}>{item.subjects.join("  ·  ")}</Text>
            )}
            <View style={styles.actions}>
              {item.status === "pending" && (
                <Pressable
                  disabled={busyId === item.id}
                  style={[styles.reject, busyId === item.id && styles.disabled]}
                  onPress={() => setRejecting(item)}
                >
                  <Text style={styles.rejectText}>Decline</Text>
                </Pressable>
              )}
              {item.status === "pending" && (
                <Pressable
                  disabled={busyId === item.id}
                  style={[
                    styles.approve,
                    busyId === item.id && styles.disabled,
                  ]}
                  onPress={() => review(item, "approve")}
                >
                  {busyId === item.id ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <Text style={styles.approveText}>Approve teacher</Text>
                  )}
                </Pressable>
              )}
            </View>
          </View>
        )}
      />
      {filter !== "pending" && audit.length > 0 && (
        <View
          style={[styles.history, { paddingHorizontal: padding, maxWidth }]}
        >
          <Text style={styles.historyTitle}>Audit history</Text>
          {audit
            .slice(-5)
            .reverse()
            .map((entry) => (
              <Text key={entry.id} style={styles.historyItem}>
                {entry.action || "reviewed"} ·{" "}
                {entry.applicationId || "application"}
                {entry.reason ? ` · ${entry.reason}` : ""}
              </Text>
            ))}
        </View>
      )}
      <Modal
        visible={Boolean(rejecting)}
        transparent
        animationType="fade"
        onRequestClose={() => setRejecting(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reason for decline</Text>
            <Text style={styles.modalText}>
              Share what the applicant should update before resubmitting.
            </Text>
            <TextInput
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              placeholder="Add a clear, helpful reason"
              placeholderTextColor="#98A2B3"
              style={styles.reasonInput}
            />
            <View style={styles.actions}>
              <Pressable
                style={styles.reject}
                onPress={() => setRejecting(null)}
              >
                <Text style={styles.rejectText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={
                  rejectionReason.trim().length < 5 || busyId === rejecting?.id
                }
                style={[
                  styles.approve,
                  (rejectionReason.trim().length < 5 ||
                    busyId === rejecting?.id) &&
                    styles.disabled,
                ]}
                onPress={() =>
                  rejecting && review(rejecting, "reject", rejectionReason)
                }
              >
                <Text style={styles.approveText}>Send feedback</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.lightBackground },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    width: "100%",
    alignSelf: "center",
  },
  dashboard: {
    flexDirection: "row",
    paddingVertical: spacing.md,
    gap: 8,
    backgroundColor: colors.white,
    width: "100%",
    alignSelf: "center",
  },
  metric: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#F4F6F8",
  },
  metricActive: { backgroundColor: colors.primary },
  metricValue: { color: colors.text, fontSize: 18, fontWeight: "800" },
  metricValueActive: { color: colors.white },
  metricLabel: { color: colors.subtitle, fontSize: 11, marginTop: 2 },
  metricLabelActive: { color: colors.white },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 3 },
  list: {
    padding: spacing.xl,
    gap: spacing.md,
    width: "100%",
    alignSelf: "center",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.primaryDark, fontSize: 18, fontWeight: "800" },
  identity: { flex: 1 },
  name: { color: colors.text, fontSize: 16, fontWeight: "700" },
  email: { color: colors.subtitle, fontSize: 13, marginTop: 3 },
  pending: {
    backgroundColor: "#FFF4D6",
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  pendingText: { color: "#9A6700", fontSize: 10, fontWeight: "800" },
  detail: { color: colors.subtitle, fontSize: 13, marginTop: spacing.md },
  viewButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginTop: spacing.md,
  },
  viewButtonText: { color: colors.primary, fontSize: 13, fontWeight: "700" },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  reject: {
    flex: 1,
    height: 44,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#D7DCE4",
    alignItems: "center",
    justifyContent: "center",
  },
  rejectText: { color: colors.text, fontWeight: "700" },
  approve: {
    flex: 1.3,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  approveText: { color: colors.white, fontWeight: "700" },
  disabled: { opacity: 0.6 },
  empty: { alignItems: "center", padding: spacing.xxl, marginTop: spacing.xxl },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.subtitle,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  history: {
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: "#E6EAF0",
    width: "100%",
    alignSelf: "center",
  },
  historyTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  historyItem: { color: colors.subtitle, fontSize: 12, marginTop: 5 },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.xl,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  modalText: { color: colors.subtitle, lineHeight: 19, marginTop: 6 },
  reasonInput: {
    minHeight: 100,
    borderWidth: 1,
    borderColor: "#D7DCE4",
    borderRadius: 10,
    padding: 12,
    marginTop: spacing.lg,
    textAlignVertical: "top",
    color: colors.text,
  },
});
