import { useRouter } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";
import { colors, radius, spacing } from "../../constants/theme";
import { PaperRevisionStatus } from "../../services/userProfile";

type PastPaperRecord = {
  id: string;
  title: string;
  subject: string;
  year: string;
  type: string;
  document?: string;
};

type RevisionEntry = PastPaperRecord & {
  status: PaperRevisionStatus | null;
};

const STATUS_LABELS: Record<PaperRevisionStatus, string> = {
  attempted: "Attempted",
  completed: "Completed",
  difficult: "Difficult",
};

const STATUS_COLORS: Record<PaperRevisionStatus, string> = {
  attempted: "#3B82F6",
  completed: "#10B981",
  difficult: "#F59E0B",
};

const pickText = (values: unknown[], fallback = ""): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
  }
  return fallback;
};

export function PaperRevisionDashboard() {
  const router = useRouter();
  const [papers, setPapers] = useState<PastPaperRecord[]>([]);
  const [revisionMap, setRevisionMap] = useState<
    Record<string, PaperRevisionStatus>
  >({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      setLoading(true);

      try {
        const userId = auth.currentUser?.uid;
        const [papersSnapshot, userSnapshot] = await Promise.all([
          getDocs(collection(db, "pastPaper")),
          userId ? getDoc(doc(db, "users", userId)) : Promise.resolve(null),
        ]);

        if (!active) return;

        const nextPapers: PastPaperRecord[] = papersSnapshot.docs.map(
          (docSnap, index) => {
            const data = docSnap.data() as Record<string, unknown>;
            return {
              id: docSnap.id || `paper-${index}`,
              title: pickText(
                [data.title, data.name, data.paperTitle],
                `Paper ${index + 1}`,
              ),
              subject: pickText(
                [data.subject, data.topic, data.course],
                "General",
              ),
              year: pickText(
                [data.year, data.examYear, data.session, data.publishedYear],
                "Recent",
              ),
              type: pickText(
                [data.type, data.examType, data.category, data.paperType],
                "Other",
              ),
              document: pickText(
                [data.doc, data.document, data.pdf, data.url],
                "",
              ),
            };
          },
        );

        const nextRevisionMap: Record<string, PaperRevisionStatus> =
          userSnapshot && userSnapshot.exists()
            ? ((userSnapshot.data()?.["paper-revision-status"] as
                | Record<string, PaperRevisionStatus>
                | undefined) ?? {})
            : {};

        setPapers(nextPapers);
        setRevisionMap(nextRevisionMap);
      } catch (error) {
        console.error("Failed to load paper revision dashboard", error);
        setPapers([]);
        setRevisionMap({});
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const entries = useMemo<RevisionEntry[]>(() => {
    return papers.map((paper) => ({
      ...paper,
      status: revisionMap[paper.id] ?? null,
    }));
  }, [papers, revisionMap]);

  const attemptedCount = entries.filter((entry) => entry.status).length;
  const completedCount = entries.filter(
    (entry) => entry.status === "completed",
  ).length;
  const difficultCount = entries.filter(
    (entry) => entry.status === "difficult",
  ).length;
  const completionRate =
    attemptedCount > 0
      ? Math.round((completedCount / attemptedCount) * 100)
      : 0;

  const subjectSummary = useMemo(() => {
    const totals: Record<string, number> = {};
    entries.forEach((entry) => {
      if (!entry.status) return;
      totals[entry.subject] = (totals[entry.subject] ?? 0) + 1;
    });

    return Object.entries(totals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [entries]);

  const recommendedPaper = useMemo(() => {
    const candidates = [...entries].sort((left, right) => {
      const leftPriority =
        left.status === "difficult" ? 2 : left.status === "attempted" ? 1 : 0;
      const rightPriority =
        right.status === "difficult" ? 2 : right.status === "attempted" ? 1 : 0;
      return rightPriority - leftPriority;
    });

    return (
      candidates.find(
        (entry) => !entry.status || entry.status !== "completed",
      ) ??
      entries[0] ??
      null
    );
  }, [entries]);

  const recentEntries = useMemo(
    () => entries.filter((entry) => entry.status).slice(0, 5),
    [entries],
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading revision dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <View style={styles.headingWrap}>
          <Text style={styles.eyebrow}>Study progress</Text>
          <Text style={styles.heading}>Paper revision dashboard</Text>
        </View>
      </View>

      <View style={styles.summaryWrap}>
        <MetricCard
          label="Attempted"
          value={String(attemptedCount)}
          accent="#3B82F6"
        />
        <MetricCard
          label="Completed"
          value={String(completedCount)}
          accent="#10B981"
        />
        <MetricCard
          label="Difficult"
          value={String(difficultCount)}
          accent="#F59E0B"
        />
        <MetricCard
          label="Rate"
          value={`${completionRate}%`}
          accent="#8B5CF6"
        />
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recommended next paper</Text>
        {recommendedPaper ? (
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({
                pathname: "/paper-preview",
                params: {
                  id: recommendedPaper.id,
                  title: recommendedPaper.title,
                  subject: recommendedPaper.subject,
                  year: recommendedPaper.year,
                  type: recommendedPaper.type,
                  document: recommendedPaper.document,
                },
              } as any)
            }
            style={styles.recommendationCard}
          >
            <Text style={styles.recommendationLabel}>
              {recommendedPaper.subject}
            </Text>
            <Text style={styles.recommendationTitle}>
              {recommendedPaper.title}
            </Text>
            <Text style={styles.recommendationMeta}>
              {recommendedPaper.year} • {recommendedPaper.type}
            </Text>
          </Pressable>
        ) : (
          <Text style={styles.emptyState}>
            No paper data yet. Start with a paper to build your revision streak.
          </Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Subject focus</Text>
        {subjectSummary.length > 0 ? (
          <View style={styles.subjectList}>
            {subjectSummary.map(([subject, count]) => (
              <View key={subject} style={styles.subjectRow}>
                <Text style={styles.subjectName}>{subject}</Text>
                <Text style={styles.subjectCount}>{count}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyState}>No subject activity yet.</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Recent revision notes</Text>
        {recentEntries.length > 0 ? (
          <View style={styles.listWrap}>
            {recentEntries.map((entry) => (
              <View key={entry.id} style={styles.listItem}>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle} numberOfLines={1}>
                    {entry.title}
                  </Text>
                  <Text style={styles.listMeta}>
                    {entry.subject} • {entry.year}
                  </Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: `${STATUS_COLORS[entry.status as PaperRevisionStatus]}20`,
                      borderColor:
                        STATUS_COLORS[entry.status as PaperRevisionStatus],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          STATUS_COLORS[entry.status as PaperRevisionStatus],
                      },
                    ]}
                  >
                    {entry.status ? STATUS_LABELS[entry.status] : "Unmarked"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyState}>
            Your recent revision status will appear here.
          </Text>
        )}
      </View>
    </ScrollView>
  );
}

function MetricCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={[styles.metricCard, { borderColor: `${accent}30` }]}>
      <Text style={[styles.metricValue, { color: accent }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightBackground,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: colors.lightBackground,
  },
  loadingText: {
    color: colors.subtitle,
    marginTop: spacing.md,
    fontSize: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  backButtonText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "700",
  },
  headingWrap: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  heading: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    marginTop: 2,
  },
  summaryWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  metricCard: {
    width: "48%",
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  metricLabel: {
    color: colors.subtitle,
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  recommendationCard: {
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: spacing.md,
  },
  recommendationLabel: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: spacing.xs,
  },
  recommendationTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
  },
  recommendationMeta: {
    color: colors.subtitle,
    fontSize: 12,
    marginTop: 4,
  },
  subjectList: {
    gap: spacing.sm,
  },
  subjectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    borderRadius: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  subjectName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  subjectCount: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  listWrap: {
    gap: spacing.sm,
  },
  listItem: {
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    borderRadius: 12,
    padding: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  listContent: {
    flex: 1,
  },
  listTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  listMeta: {
    color: colors.subtitle,
    fontSize: 12,
    marginTop: 4,
  },
  statusBadge: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "700",
  },
  emptyState: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 20,
  },
});
