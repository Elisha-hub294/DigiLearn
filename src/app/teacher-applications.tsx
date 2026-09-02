import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { db } from "../../firebaseConfig";
import { colors, radius, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";

type Application = {
  id: string;
  name?: string;
  email?: string;
  school?: string;
  subjects?: string[];
  status?: string;
};

export default function TeacherApplicationsScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const [applications, setApplications] = useState<Application[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    if (profile?.type !== "admin") return;
    return onSnapshot(collection(db, "teacherApplications"), (snapshot) => {
      setApplications(
        snapshot.docs
          .map((item) => ({ id: item.id, ...item.data() }) as Application)
          .filter((item) => item.status === "pending"),
      );
    });
  }, [profile?.type]);

  const review = async (application: Application, approved: boolean) => {
    setBusyId(application.id);
    try {
      const applicationRef = doc(db, "teacherApplications", application.id);
      const userRef = doc(db, "users", application.id);
      if (approved) {
        const userSnapshot = await getDoc(userRef);
        await setDoc(
          doc(db, "teachers", application.id),
          {
            ...userSnapshot.data(),
            type: "teacher",
            teacherApprovalStatus: "approved",
            approvedAt: serverTimestamp(),
          },
          { merge: true },
        );
        await updateDoc(userRef, {
          type: "teacher",
          teacherApprovalStatus: "approved",
        });
      } else {
        await updateDoc(userRef, { teacherApprovalStatus: "rejected" });
      }
      await updateDoc(applicationRef, {
        status: approved ? "approved" : "rejected",
        reviewedAt: serverTimestamp(),
      });
      Alert.alert(approved ? "Teacher approved" : "Application declined");
    } catch (error) {
      console.error("Failed to review teacher application:", error);
      Alert.alert("Review failed", "Please try again.");
    } finally {
      setBusyId(null);
    }
  };

  if (profile?.type !== "admin") return null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
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
      <FlatList
        data={applications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="check-circle" size={34} color={colors.green} />
            <Text style={styles.emptyTitle}>All caught up</Text>
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
              <Pressable
                disabled={busyId === item.id}
                style={[styles.reject, busyId === item.id && styles.disabled]}
                onPress={() => review(item, false)}
              >
                <Text style={styles.rejectText}>Decline</Text>
              </Pressable>
              <Pressable
                disabled={busyId === item.id}
                style={[styles.approve, busyId === item.id && styles.disabled]}
                onPress={() => review(item, true)}
              >
                {busyId === item.id ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.approveText}>Approve teacher</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.lightBackground },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.white,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
  },
  title: { color: colors.text, fontSize: 24, fontWeight: "800", marginTop: 3 },
  list: { padding: spacing.xl, gap: spacing.md },
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
});
