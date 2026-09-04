import { Feather, Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { auth, db } from "../../../firebaseConfig";
import { getHorizontalPadding } from "../../constants/layout";
import { colors, radius, spacing } from "../../constants/theme";
import { recordUserActivity } from "../../services/activityService";
import { readThroughFirestoreCache } from "../../services/firestoreReadCache";
import {
  PaperRevisionStatus,
  setPaperRevisionStatus,
  toggleSavedItem,
} from "../../services/userProfile";
import { feedbackMessages, showNativeToast } from "../../utils/nativeToast";
import { ActionDialog } from "../ui/ActionDialog";
import { Skeleton } from "../ui/Skeleton";

type PaperPreviewData = {
  id: string;
  title: string;
  subject?: string;
  year?: string;
  description?: string;
  level?: string;
  pageNumber?: string | number;
  paperCode?: string;
  paperNumber?: string | number;
  image?: string;
  document?: string;
  type?: string;
};

const pickString = (values: unknown[], fallback = ""): string => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
  }
  return fallback;
};

const normalizePaperNumber = (value?: string | number): string => {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value.trim();
  return "";
};

const formatPageCount = (value?: string | number): string => {
  const normalized = normalizePaperNumber(value);
  if (!normalized) return "N/A";
  const numeric = Number(normalized);
  if (!Number.isNaN(numeric)) {
    return `${numeric} ${numeric === 1 ? "Page" : "Pages"}`;
  }
  return normalized;
};

const formatPaperReference = (
  paperCode?: string,
  paperNumber?: string | number,
): string => {
  const code = paperCode?.trim();
  const number = normalizePaperNumber(paperNumber);

  if (!code && !number) return "Paper details unavailable";
  if (code && number) return `${code}/${number}`;
  if (code) return code;
  return `Paper ${number}`;
};

const formatLevelLabel = (level?: string): string => {
  const normalized = level?.trim();
  if (!normalized) return "General";
  const lower = normalized.toLowerCase();
  if (lower === "ordinary") return "O-level";
  if (lower === "advanced") return "A-level";
  if (lower === "primary") return "Primary level";
  return normalized;
};

const mapPaperData = (
  id: string,
  data: Record<string, unknown>,
): PaperPreviewData => ({
  id,
  title: pickString(
    [data.title, data.name, data.paperTitle],
    "Untitled past paper",
  ),
  subject: pickString([data.subject, data.topic, data.course], "General"),
  year: pickString(
    [data.year, data.examYear, data.session, data.publishedYear],
    "",
  ),
  description: pickString(
    [data.description, data.summary, data.caption, data.notes],
    "No description added yet.",
  ),
  level: pickString(
    [data.level, data.examLevel, data.classLevel, data.educationLevel],
    "",
  ),
  pageNumber: pickString(
    [data.pageNumber, data.pages, data.pageCount, data.totalPages],
    "",
  ),
  paperCode: pickString([data.paperCode, data.code], ""),
  paperNumber: pickString([data.paperNumber, data.number], ""),
  image: pickString(
    [data.cover, data.image, data.coverImage, data.thumbnail],
    "",
  ),
  document: pickString([data.doc, data.document, data.pdf, data.url], ""),
  type: pickString(
    [data.type, data.examType, data.category, data.paperType],
    "Other",
  ),
});

export function PaperPreviewScreen() {
  const params = useLocalSearchParams<{
    id?: string;
    title?: string;
    subject?: string;
    year?: string;
    description?: string;
    level?: string;
    pageNumber?: string;
    paperCode?: string;
    paperNumber?: string;
    image?: string;
    document?: string;
    type?: string;
  }>();

  const [paper, setPaper] = useState<PaperPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [revisionStatus, setRevisionStatus] =
    useState<PaperRevisionStatus | null>(null);
  const [showGuestSaveAlert, setShowGuestSaveAlert] = useState(false);
  const [relatedPapers, setRelatedPapers] = useState<PaperPreviewData[]>([]);
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 600 ? 0 : getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);

  useEffect(() => {
    let active = true;

    const run = async () => {
      setLoading(true);

      try {
        if (params.id) {
          if (auth.currentUser?.uid) {
            recordUserActivity(auth.currentUser.uid, "paper", params.id);
          }

          const snap = await getDoc(doc(db, "pastPaper", params.id));
          if (!active) return;

          if (snap.exists()) {
            setPaper(
              mapPaperData(snap.id, snap.data() as Record<string, unknown>),
            );
            return;
          }
        }

        const fallback: PaperPreviewData = {
          id: params.id ?? "paper-preview",
          title: params.title ?? "Past paper",
          subject: params.subject ?? "General",
          year: params.year ?? "",
          description: params.description ?? "No description added yet.",
          level: params.level ?? "",
          pageNumber: params.pageNumber ?? "",
          paperCode: params.paperCode ?? "",
          paperNumber: params.paperNumber ?? "",
          image: params.image ?? "",
          document: params.document ?? "",
          type: params.type ?? "Other",
        };

        if (active) setPaper(fallback);
      } catch (error) {
        console.error("Failed to load past paper preview", error);
        if (active) {
          setPaper({
            id: params.id ?? "paper-preview",
            title: params.title ?? "Past paper",
            subject: params.subject ?? "General",
            year: params.year ?? "",
            description: params.description ?? "No description added yet.",
            level: params.level ?? "",
            pageNumber: params.pageNumber ?? "",
            paperCode: params.paperCode ?? "",
            paperNumber: params.paperNumber ?? "",
            image: params.image ?? "",
            document: params.document ?? "",
            type: params.type ?? "Other",
          });
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void run();

    return () => {
      active = false;
    };
  }, [
    params.id,
    params.title,
    params.subject,
    params.year,
    params.description,
    params.level,
    params.pageNumber,
    params.paperCode,
    params.paperNumber,
    params.image,
    params.document,
    params.type,
  ]);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!paper?.id || !userId) {
      return;
    }

    let active = true;

    const loadUserPaperState = async () => {
      try {
        const userSnap = await getDoc(doc(db, "users", userId));
        const savedPapers = Array.isArray(userSnap.data()?.["saved-papers"])
          ? userSnap.data()?.["saved-papers"]
          : [];
        const revisionMap =
          userSnap.data()?.["paper-revision-status"] &&
          typeof userSnap.data()?.["paper-revision-status"] === "object"
            ? (userSnap.data()?.["paper-revision-status"] as Record<
                string,
                PaperRevisionStatus
              >)
            : {};

        if (active) {
          setBookmarked(savedPapers.includes(paper.id));
          setRevisionStatus(revisionMap[paper.id] ?? null);
        }
      } catch (error) {
        console.error("Failed to check paper bookmark status", error);
      }
    };

    void loadUserPaperState();

    return () => {
      active = false;
    };
  }, [paper?.id]);

  useEffect(() => {
    if (!paper?.id || !paper?.subject) {
      return;
    }

    let active = true;

    const loadRelatedPapers = async () => {
      try {
        const relatedQuery = paper.type
          ? query(
              collection(db, "pastPaper"),
              where("subject", "==", paper.subject),
              where("type", "==", paper.type),
              limit(20),
            )
          : query(
              collection(db, "pastPaper"),
              where("subject", "==", paper.subject),
              limit(20),
            );
        const cacheKey = `related-papers:${paper.subject}:${paper.type ?? ""}`;
        const snap = await readThroughFirestoreCache(cacheKey, () =>
          getDocs(relatedQuery),
        );
        const allPapers = snap.docs.map((docSnap) => {
          const data = docSnap.data() as Record<string, unknown>;
          return mapPaperData(docSnap.id, data);
        });

        const currentYear = paper.year ? parseInt(paper.year, 10) : 0;
        const related = allPapers
          .filter((p) => {
            if (p.id === paper.id) return false;
            const subjectMatch =
              p.subject?.toLowerCase() === paper.subject?.toLowerCase();
            const typeMatch =
              !paper.type || p.type?.toLowerCase() === paper.type.toLowerCase();
            return subjectMatch && typeMatch;
          })
          .sort((a, b) => {
            const aYear = a.year ? parseInt(a.year, 10) : 0;
            const bYear = b.year ? parseInt(b.year, 10) : 0;
            const aYearDiff = Math.abs(aYear - currentYear);
            const bYearDiff = Math.abs(bYear - currentYear);
            return aYearDiff - bYearDiff;
          })
          .slice(0, 4);

        if (active) setRelatedPapers(related);
      } catch (error) {
        console.error("Failed to load related papers", error);
        if (active) setRelatedPapers([]);
      }
    };

    void loadRelatedPapers();

    return () => {
      active = false;
    };
  }, [paper?.id, paper?.subject, paper?.year, paper?.type]);

  const paperRef = useMemo(
    () => formatPaperReference(paper?.paperCode, paper?.paperNumber),
    [paper?.paperCode, paper?.paperNumber],
  );

  const paperPreviewRoute = `/paper-preview?id=${encodeURIComponent(
    paper?.id ?? params.id ?? "",
  )}`;

  const stats = [
    { label: "Year", value: paper?.year || "Recent" },
    { label: "Level", value: formatLevelLabel(paper?.level) },
    {
      label: "Pages",
      value: paper ? formatPageCount(paper.pageNumber) : "N/A",
    },
    { label: "Reference", value: paperRef },
  ];

  const openDocument = () => {
    if (!paper?.document) return;
    router.push({
      pathname: "/pdf-reader",
      params: { uri: encodeURIComponent(paper.document), title: paper.title },
    } as any);
  };

  const sharePaper = async () => {
    if (!paper) return;
    const shareText = [paper.title, paper.subject, paperRef, paper.document]
      .filter(Boolean)
      .join(" • ");

    try {
      await Share.share({
        message: shareText,
        title: paper.title,
      });
    } catch (error) {
      console.warn("Share cancelled", error);
    }
  };

  const toggleBookmark = async () => {
    if (!paper) return;

    const userId = auth.currentUser?.uid;
    if (!userId) {
      setShowGuestSaveAlert(true);
      return;
    }

    try {
      await toggleSavedItem(userId, "saved-papers", paper.id, bookmarked);
      setBookmarked((value) => !value);
      showNativeToast(
        bookmarked ? feedbackMessages.itemUnsaved : feedbackMessages.itemSaved,
      );
    } catch (error) {
      console.error("Failed to toggle paper bookmark", error);
    }
  };

  const updateRevisionStatus = async (nextStatus: PaperRevisionStatus) => {
    if (!paper) return;

    const userId = auth.currentUser?.uid;
    if (!userId) {
      setShowGuestSaveAlert(true);
      return;
    }

    try {
      await setPaperRevisionStatus(userId, paper.id, nextStatus);
      setRevisionStatus(nextStatus);
      showNativeToast(feedbackMessages.revisionUpdated);
    } catch (error) {
      console.error("Failed to update revision status", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Skeleton style={styles.loadingHeroSkeleton} />
        <Skeleton style={styles.loadingTitleSkeleton} />
        <Skeleton style={styles.loadingLineSkeleton} />
        <Skeleton style={styles.loadingLineShortSkeleton} />
      </View>
    );
  }

  if (!paper) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.title}>Paper unavailable</Text>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { alignItems: "center" }]}>
      <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.content,
            { paddingHorizontal: horizontalPadding },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>←</Text>
            </Pressable>
            <View style={styles.headerMeta}>
              <Text style={styles.eyebrow}>
                {paper.type?.toUpperCase() || "PAST PAPER"}
              </Text>
              <Text style={styles.headerTitle}>Paper preview</Text>
            </View>
          </View>

          <View style={styles.heroCard}>
            <View style={styles.heroImageWrap}>
              {paper.image ? (
                <Image
                  source={{ uri: paper.image }}
                  style={styles.heroImage}
                  contentFit="cover"
                  contentPosition="top left"
                />
              ) : (
                <View style={styles.placeholderCover}>
                  <Text style={styles.placeholderText}>
                    {paper.title.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.heroOverlay} />
            </View>

            <View style={styles.heroContent}>
              <Text style={styles.subjectBadge}>
                {paper.subject || "General"}
              </Text>
              <Text style={styles.title}>{paper.title}</Text>
              <Text style={styles.metaLine}>
                {paper.year || "Recent paper"} • {paperRef}
              </Text>

              <View style={styles.actionRow}>
                <Pressable
                  accessibilityRole="button"
                  style={[
                    styles.primaryButton,
                    !paper.document && styles.disabledButton,
                  ]}
                  onPress={openDocument}
                  disabled={!paper.document}
                >
                  <View style={styles.buttonContent}>
                    <Feather name="book-open" size={16} color={colors.white} />
                    <Text style={styles.primaryButtonText}>
                      {paper.document ? "Open" : "No document"}
                    </Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  style={styles.secondaryButton}
                  onPress={sharePaper}
                >
                  <View style={styles.buttonContent}>
                    <Feather name="share-2" size={15} color={colors.text} />
                    <Text style={styles.secondaryButtonText}>Share</Text>
                  </View>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    bookmarked ? "Remove saved paper" : "Save paper"
                  }
                  style={[
                    styles.secondaryButton,
                    bookmarked && styles.savedButton,
                  ]}
                  onPress={toggleBookmark}
                >
                  <View style={styles.buttonContent}>
                    <Ionicons
                      name={bookmarked ? "bookmark" : "bookmark-outline"}
                      size={15}
                      color={bookmarked ? colors.primary : colors.text}
                    />
                    <Text style={styles.secondaryButtonText}>
                      {bookmarked ? "Saved" : "Save"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.statsWrap}>
            {stats.map((stat) => (
              <View key={stat.label} style={styles.statCard}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.description}>
              {paper.description || "No description provided for this paper."}
            </Text>
          </View>

          <View style={styles.detailsCard}>
            <Text style={styles.sectionTitle}>Paper details</Text>
            <View style={styles.detailList}>
              <DetailRow
                label="Subject"
                value={paper.subject || "General"}
                icon="book-open"
              />
              <DetailRow
                label="Level"
                value={formatLevelLabel(paper.level)}
                icon="bar-chart-2"
              />
              <DetailRow
                label="Pages"
                value={formatPageCount(paper.pageNumber)}
                icon="file-text"
              />
              <DetailRow label="Reference" value={paperRef} icon="hash" />
              <DetailRow
                label="Year"
                value={paper.year || "Recent"}
                icon="calendar"
              />
            </View>
          </View>

          {relatedPapers.length > 0 && (
            <View style={styles.relatedCard}>
              <Text style={styles.sectionTitle}>
                {`More of ${paper?.subject || "this"}`}
              </Text>
              <Text style={styles.relatedHint}>
                Similar papers to build comprehensive coverage
              </Text>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={relatedPapers}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.relatedList}
                ItemSeparatorComponent={() => (
                  <View style={{ width: spacing.md }} />
                )}
                renderItem={({ item: relatedPaper }) => (
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/paper-preview",
                        params: {
                          id: relatedPaper.id,
                          title: relatedPaper.title,
                          subject: relatedPaper.subject,
                          year: relatedPaper.year,
                          type: relatedPaper.type,
                          document: relatedPaper.document,
                          image: relatedPaper.image,
                        },
                      } as any)
                    }
                    style={styles.relatedItem}
                  >
                    <View style={styles.relatedImageWrap}>
                      {relatedPaper.image ? (
                        <Image
                          source={{ uri: relatedPaper.image }}
                          style={styles.relatedImage}
                          contentFit="cover"
                          contentPosition="top left"
                        />
                      ) : (
                        <View style={styles.relatedPlaceholder}>
                          <Text style={styles.relatedPlaceholderText}>
                            {relatedPaper.title.slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.relatedContent}>
                      <Text style={styles.relatedYear}>
                        {relatedPaper.year || "Recent"}
                      </Text>
                      <Text style={styles.relatedTitle} numberOfLines={2}>
                        {relatedPaper.title}
                      </Text>
                      <Text style={styles.relatedMeta}>
                        {relatedPaper.type || "Paper"}
                      </Text>
                    </View>
                  </Pressable>
                )}
              />
            </View>
          )}

          <ActionDialog
            visible={showGuestSaveAlert}
            title="Save this resource"
            message="Log in or sign up to save past papers and resources for later."
            primaryText="Log in"
            secondaryText="Sign up"
            onPrimary={() =>
              router.push({
                pathname: "/login",
                params: { from: paperPreviewRoute },
              } as any)
            }
            onSecondary={() =>
              router.push({
                pathname: "/signup",
                params: { from: paperPreviewRoute },
              } as any)
            }
            onClose={() => setShowGuestSaveAlert(false)}
          />
        </ScrollView>
      </View>
    </View>
  );
}

function DetailRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: keyof typeof Feather.glyphMap;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLabelWrap}>
        <Feather name={icon} size={14} color={colors.subtitle} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.lightBackground,
    width: "100%",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
  },
  content: {
    paddingBottom: spacing.xxl,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.lightBackground,
    padding: spacing.xl,
  },
  loadingText: {
    color: colors.subtitle,
    fontSize: 14,
    marginTop: spacing.md,
  },
  loadingHeroSkeleton: { width: "100%", height: 180, marginBottom: spacing.lg },
  loadingTitleSkeleton: { width: "68%", height: 22, marginBottom: spacing.md },
  loadingLineSkeleton: { width: "100%", height: 13, marginBottom: spacing.sm },
  loadingLineShortSkeleton: { width: "62%", height: 13 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  backButtonText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 22,
  },
  headerMeta: {
    flex: 1,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    marginTop: 2,
  },
  heroCard: {
    backgroundColor: colors.white,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  heroImageWrap: {
    width: "100%",
    height: 240,
    backgroundColor: "#E5E7EB",
    position: "relative",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.16)",
  },
  placeholderCover: {
    flex: 1,
    backgroundColor: "#0F6FFF",
    alignItems: "center",
    justifyContent: "center",
  },
  placeholderText: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: 2,
  },
  heroContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  subjectBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#EAF3FF",
    color: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    marginTop: spacing.md,
    lineHeight: 34,
    textTransform: "capitalize",
  },
  metaLine: {
    color: colors.subtitle,
    fontSize: 13,
    marginTop: spacing.sm,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  disabledButton: {
    opacity: 0.55,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "800",
  },
  secondaryButton: {
    minWidth: 104,
    backgroundColor: "#F3F4F6",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },
  statsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  statCard: {
    flexBasis: "48%",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  statLabel: {
    color: colors.subtitle,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  statValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginTop: 6,
  },
  detailsCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 22,
  },
  detailList: {
    gap: spacing.sm,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(15, 23, 42, 0.06)",
  },
  detailLabelWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailLabel: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "600",
  },
  detailValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "right",
    flexShrink: 1,
  },

  savedButton: {
    backgroundColor: "#EAF3FF",
    borderColor: "rgba(15, 111, 255, 0.18)",
  },
  relatedCard: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    marginBottom: spacing.lg,
  },
  relatedHint: {
    color: colors.subtitle,
    fontSize: 12,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  relatedList: {
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  relatedItem: {
    width: 180,
    backgroundColor: colors.lightBackground,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
    overflow: "hidden",
    padding: spacing.sm,
  },
  relatedImageWrap: {
    width: "100%",
    height: 110,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  relatedImage: {
    width: "100%",
    height: "100%",
  },
  relatedPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  relatedPlaceholderText: {
    color: colors.white,
    fontWeight: "700",
    fontSize: 18,
  },
  relatedContent: {
    marginTop: spacing.sm,
    justifyContent: "center",
  },
  relatedYear: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  relatedTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    minHeight: 36,
  },
  relatedMeta: {
    color: colors.subtitle,
    fontSize: 11,
  },
});
