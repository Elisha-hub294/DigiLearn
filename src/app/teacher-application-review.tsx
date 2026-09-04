import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import { ActionDialog } from "../components/ui/ActionDialog";
import { Skeleton } from "../components/ui/Skeleton";
import { colors, radius, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import { reviewTeacherApplication } from "../services/teacherApplications";

type Application = {
  id: string;
  name?: string;
  email?: string;
  school?: string;
  subjects?: string[];
  phone?: string;
  youtube?: string;
  socials?: Record<string, string>;
  status?: "pending" | "approved" | "rejected";
  createdAt?: { toDate?: () => Date } | string | number;
  rejectionReason?: string;
};

type AuditEntry = {
  id: string;
  action?: string;
  reason?: string;
  adminId?: string;
  createdAt?: { toDate?: () => Date } | string | number;
};

const formatDate = (
  value: Application["createdAt"] | AuditEntry["createdAt"],
) => {
  if (!value) return "Date unavailable";
  const date =
    typeof value === "object" && value.toDate
      ? value.toDate()
      : typeof value === "number" || typeof value === "string"
        ? new Date(value)
        : new Date(NaN);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
};

export default function TeacherApplicationReviewScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { applicationId } = useLocalSearchParams<{ applicationId?: string }>();
  const [application, setApplication] = useState<Application | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reason, setReason] = useState("");
  const [reviewStartedAt] = useState(() => Date.now());
  const [reviewDialog, setReviewDialog] = useState({
    visible: false,
    title: "",
    message: "",
  });
  const [approveDialogVisible, setApproveDialogVisible] = useState(false);

  useEffect(() => {
    if (profile?.type !== "admin" || !applicationId) return;
    let active = true;
    const load = async () => {
      const snapshot = await getDoc(
        doc(db, "teacherApplications", applicationId),
      );
      if (active && snapshot.exists()) {
        setApplication({ id: snapshot.id, ...snapshot.data() } as Application);
      }
      if (active) setLoading(false);
    };
    void load();
    const unsubscribe = onSnapshot(
      query(
        collection(db, "teacherApplicationAudit"),
        where("applicationId", "==", applicationId),
      ),
      (snapshot) =>
        setAudit(
          snapshot.docs.map(
            (item) => ({ id: item.id, ...item.data() }) as AuditEntry,
          ),
        ),
    );
    return () => {
      active = false;
      unsubscribe();
    };
  }, [applicationId, profile?.type]);

  const ageLabel = useMemo(() => {
    if (!application?.createdAt) return "SLA unavailable";
    const value = application.createdAt;
    const created =
      typeof value === "object" && value.toDate
        ? value.toDate().getTime()
        : typeof value === "number" || typeof value === "string"
          ? new Date(value).getTime()
          : Number.NaN;
    if (Number.isNaN(created)) return "SLA unavailable";
    const days = Math.floor((reviewStartedAt - created) / 86400000);
    return days > 0
      ? `${days} day${days === 1 ? "" : "s"} in review`
      : "Submitted today";
  }, [application?.createdAt, reviewStartedAt]);

  const submitReview = async (decision: "approve" | "reject") => {
    if (!application || busy) return;
    if (decision === "reject" && reason.trim().length < 5) return;
    setBusy(true);
    try {
      await reviewTeacherApplication(application.id, decision, reason);
      setShowRejectModal(false);
      setReviewDialog({
        visible: true,
        title: decision === "approve" ? "Teacher approved" : "Feedback sent",
        message: "The applicant has been notified.",
      });
    } catch (error) {
      console.error("Failed to review teacher application:", error);
      setReviewDialog({
        visible: true,
        title: "Review failed",
        message: "The application was not changed. Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  if (profile?.type !== "admin") return null;
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Skeleton style={styles.loadingSkeleton} />
        </View>
      </SafeAreaView>
    );
  }
  if (!application) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <Feather name="file-text" size={38} color={colors.subtitle} />
          <Text style={styles.emptyTitle}>Application unavailable</Text>
          <Text style={styles.emptyText}>
            This application may have been removed or already archived.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPending = application.status === "pending";
  return (
    <SafeAreaView style={styles.safeArea}>
      <ActionDialog
        visible={reviewDialog.visible}
        title={reviewDialog.title}
        message={reviewDialog.message}
        primaryText="Done"
        onPrimary={() => {
          setReviewDialog((current) => ({ ...current, visible: false }));
          router.back();
        }}
        onClose={() => {
          setReviewDialog((current) => ({ ...current, visible: false }));
          router.back();
        }}
      />
      <ActionDialog
        visible={approveDialogVisible}
        title="Approve teacher?"
        message="This grants the applicant teacher access and publishing permissions."
        primaryText="Approve"
        secondaryText="Cancel"
        onPrimary={() => {
          setApproveDialogVisible(false);
          void submitReview("approve");
        }}
        onSecondary={() => setApproveDialogVisible(false)}
        onClose={() => setApproveDialogVisible(false)}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.iconButton}
          >
            <Feather name="arrow-left" size={21} color={colors.text} />
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={styles.eyebrow}>ADMIN REVIEW</Text>
            <Text style={styles.title}>Teacher application</Text>
          </View>
          <View style={styles.status}>
            <Text style={styles.statusText}>
              {application.status?.toUpperCase() || "UNKNOWN"}
            </Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(application.name || "T").slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.heroCopy}>
            <Text style={styles.name}>
              {application.name || "Unnamed applicant"}
            </Text>
            <Text style={styles.email}>
              {application.email || "No email provided"}
            </Text>
          </View>
        </View>

        <View style={styles.slaCard}>
          <Feather name="clock" size={18} color="#946200" />
          <View style={styles.slaCopy}>
            <Text style={styles.slaTitle}>{ageLabel}</Text>
            <Text style={styles.slaText}>
              Applications older than 3 days are highlighted for admin
              follow-up.
            </Text>
          </View>
        </View>

        <Section title="Profile details">
          <Detail label="School or institution" value={application.school} />
          <Detail
            label="Subjects"
            value={application.subjects?.join("  ·  ")}
          />
          <Detail label="Phone" value={application.phone} />
          <Detail label="YouTube" value={application.youtube} />
        </Section>
        <Section title="Review history">
          {audit.length === 0 ? (
            <Text style={styles.muted}>
              No previous review actions. Submitted{" "}
              {formatDate(application.createdAt)}.
            </Text>
          ) : (
            audit.map((entry) => (
              <View key={entry.id} style={styles.auditRow}>
                <View style={styles.auditDot} />
                <View>
                  <Text style={styles.auditAction}>
                    {entry.action || "Review action"}
                  </Text>
                  <Text style={styles.muted}>
                    {formatDate(entry.createdAt)}
                    {entry.adminId
                      ? `  ·  Admin ${entry.adminId.slice(0, 6)}`
                      : ""}
                  </Text>
                  {entry.reason ? (
                    <Text style={styles.auditReason}>{entry.reason}</Text>
                  ) : null}
                </View>
              </View>
            ))
          )}
        </Section>

        {isPending ? (
          <View style={styles.decisionPanel}>
            <Text style={styles.decisionTitle}>Make a decision</Text>
            <Text style={styles.decisionText}>
              Review the details above before granting teacher publishing
              access.
            </Text>
            <View style={styles.actions}>
              <Pressable
                disabled={busy}
                style={styles.rejectButton}
                onPress={() => setShowRejectModal(true)}
              >
                <Text style={styles.rejectText}>Request changes</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                style={styles.approveButton}
                onPress={() => setApproveDialogVisible(true)}
              >
                {busy ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.approveText}>Confirm teacher</Text>
                )}
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.closedCard}>
            <Feather name="check-circle" size={20} color={colors.green} />
            <Text style={styles.closedText}>
              This application has already been reviewed.
            </Text>
          </View>
        )}
      </ScrollView>
      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Request changes</Text>
            <Text style={styles.modalText}>
              Give the applicant clear feedback before they resubmit.
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              multiline
              placeholder="Example: Please add your school and the subjects you teach."
              placeholderTextColor="#98A2B3"
              style={styles.reasonInput}
            />
            <View style={styles.actions}>
              <Pressable
                style={styles.rejectButton}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.rejectText}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={reason.trim().length < 5 || busy}
                style={[
                  styles.approveButton,
                  (reason.trim().length < 5 || busy) && styles.disabled,
                ]}
                onPress={() => void submitReview("reject")}
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}
function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.detail}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || "Not provided"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.lightBackground },
  content: { paddingBottom: spacing.xxl },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xxl,
  },
  loadingSkeleton: { width: "86%", height: 180, borderRadius: 14 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  topCopy: { flex: 1 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.6,
  },
  title: { color: colors.text, fontSize: 23, fontWeight: "800", marginTop: 3 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F1F4F7",
  },
  status: {
    backgroundColor: "#FFF4D6",
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },
  statusText: { color: "#946200", fontSize: 10, fontWeight: "800" },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderColor: "#EEF1F4",
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },
  avatarText: { color: colors.primaryDark, fontSize: 26, fontWeight: "800" },
  heroCopy: { flex: 1 },
  name: { color: colors.text, fontSize: 21, fontWeight: "800" },
  email: { color: colors.subtitle, fontSize: 14, marginTop: 4 },
  slaCard: {
    flexDirection: "row",
    gap: spacing.sm,
    margin: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: "#FFF8E6",
    borderWidth: 1,
    borderColor: "#F2D48A",
  },
  slaCopy: { flex: 1 },
  slaTitle: { color: "#6B4B00", fontWeight: "800", fontSize: 13 },
  slaText: { color: "#80621A", fontSize: 12, lineHeight: 17, marginTop: 3 },
  section: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#E6EAF0",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  detail: { borderTopWidth: 1, borderColor: "#EEF1F4", paddingVertical: 10 },
  detailLabel: {
    color: colors.subtitle,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailValue: { color: colors.text, fontSize: 14, marginTop: 4 },
  muted: { color: colors.subtitle, fontSize: 13, lineHeight: 19 },
  auditRow: { flexDirection: "row", gap: spacing.sm, paddingVertical: 8 },
  auditDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    backgroundColor: colors.primary,
  },
  auditAction: { color: colors.text, fontWeight: "700", fontSize: 13 },
  auditReason: {
    color: colors.subtitle,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  decisionPanel: {
    margin: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: "#EEF6FF",
    borderWidth: 1,
    borderColor: "#C9DFFF",
  },
  decisionTitle: { color: colors.text, fontSize: 17, fontWeight: "800" },
  decisionText: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
  },
  actions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg },
  rejectButton: {
    flex: 1,
    minHeight: 46,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: "#D7DCE4",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  rejectText: { color: colors.text, fontWeight: "700", textAlign: "center" },
  approveButton: {
    flex: 1.2,
    minHeight: 46,
    borderRadius: radius.sm,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  approveText: { color: colors.white, fontWeight: "700", textAlign: "center" },
  disabled: { opacity: 0.55 },
  closedCard: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center",
    margin: spacing.xl,
    padding: spacing.lg,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
  },
  closedText: { color: colors.text, fontWeight: "700" },
  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: spacing.md,
  },
  emptyText: {
    color: colors.subtitle,
    textAlign: "center",
    marginTop: spacing.sm,
    lineHeight: 19,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: "rgba(15,23,42,0.45)",
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.xl,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: "800" },
  modalText: { color: colors.subtitle, lineHeight: 19, marginTop: 6 },
  reasonInput: {
    minHeight: 110,
    borderWidth: 1,
    borderColor: "#D7DCE4",
    borderRadius: 10,
    padding: 12,
    marginTop: spacing.lg,
    textAlignVertical: "top",
    color: colors.text,
  },
});
