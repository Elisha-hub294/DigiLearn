import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { db } from "../../../firebaseConfig";
import { colors, radius, spacing } from "../../constants/theme";
import PdfPreview from "./PdfPreview";

type PastPaper = {
  id: string;
  title?: string;
  exam?: string;
  description?: string;
  date?: unknown;
  image?: any;
  pages?: string;
  document?: string;
};

type PaperSection = {
  title: string;
  papers: PastPaper[];
};

const pickString = (value: unknown, fallback = "") => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
};

const pickImage = (value: unknown, fallback: any) => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return fallback;
};

const formatDate = (value: unknown) => {
  if (!value) {
    return "Recently added";
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    return (value as { toDate: () => Date }).toDate().toLocaleDateString();
  }

  if (value instanceof Date) {
    return value.toLocaleDateString();
  }

  if (typeof value === "string") {
    return new Date(value).toLocaleDateString();
  }

  return "Recently added";
};

export const UnebCard = () => {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [sections, setSections] = useState<PaperSection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPastPapers = async () => {
      try {
        const collectionNames = ["pastPaper", "pastpaper"];
        const groupedPapers = new Map<string, PastPaper[]>();

        for (const collectionName of collectionNames) {
          try {
            const papersRef = collection(db, collectionName);
            const papersQuery = query(papersRef, orderBy("createdAt", "desc"));
            const snapshot = await getDocs(papersQuery);

            const mappedPapers = snapshot.docs.map((doc) => {
              const data = doc.data() as Record<string, any>;
              const type = pickString(
                data.type || data.examType || data.category || data.paperType,
                "",
              ).toLowerCase();

              if (type !== "uneb" && type !== "mock") {
                return null;
              }

              const paper = {
                id: doc.id,
                title: pickString(data.title || data.name, "Past paper"),
                exam: pickString(
                  data.type || data.examType || data.paperType,
                  "UNEB",
                ),
                description: pickString(
                  data.subject ||
                    data.topic ||
                    data.description ||
                    data.summary,
                  "Study resource available for download.",
                ),
                date:
                  data.createdAt || data.date || data.publishedAt || data.year,
                image: pickImage(
                  data.image || data.coverImage || data.thumbnail,
                  require("../../../assets/images/pdf-preview.jpeg"),
                ),
                pages: pickString(data.pages || data.pageCount, "12 pages"),
                document: pickString(
                  data.doc || data.document || data.pdf || data.url,
                  "",
                ),
              } satisfies PastPaper;

              const normalizedType = paper.exam?.toLowerCase() || "uneb";
              const existingPapers = groupedPapers.get(normalizedType) ?? [];
              existingPapers.push(paper);
              groupedPapers.set(normalizedType, existingPapers);

              return null;
            });

            if (groupedPapers.size > 0) {
              const sectionEntries = Array.from(groupedPapers.entries()).map(
                ([type, papers]) => ({
                  title: type === "mock" ? "Mock papers" : "UNEB papers",
                  papers,
                }),
              );

              setSections(sectionEntries);
              break;
            }
          } catch (collectionError) {
            console.warn(`Unable to read ${collectionName}`, collectionError);
          }
        }

        if (!isMounted) {
          return;
        }

        if (sections.length === 0 && !isMounted) {
          return;
        }

        if (!isMounted) {
          return;
        }

        setSections(
          Array.from(groupedPapers.entries()).map(([type, papers]) => ({
            title: type === "mock" ? "Mock papers" : "UNEB papers",
            papers,
          })),
        );
      } catch (error) {
        console.error("Failed to load past papers", error);
        if (isMounted) {
          setSections([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPastPapers();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Animated.View
        entering={FadeInUp.duration(580)}
        style={[styles.card, isWide && styles.cardWide]}
      >
        <Text style={styles.title}>Loading papers...</Text>
      </Animated.View>
    );
  }

  if (sections.length === 0) {
    return (
      <Animated.View
        entering={FadeInUp.duration(580)}
        style={[styles.card, isWide && styles.cardWide]}
      >
        <Text style={styles.title}>No past papers available yet.</Text>
      </Animated.View>
    );
  }

  return (
    <View style={styles.list}>
      {sections.map((section, sectionIndex) => (
        <View key={section.title} style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.papers.map((paper, index) => {
            const title = paper.title ?? "Past paper";
            const exam = paper.exam ?? "Exam";
            const description =
              paper.description ?? "Study resource available for download.";
            const pagesText = paper.pages ?? "12 pages";
            const dateText = formatDate(paper.date);

            return (
              <Animated.View
                key={paper.id}
                entering={FadeInUp.duration(
                  580 + sectionIndex * 120 + index * 80,
                )}
                style={[styles.card, isWide && styles.cardWide]}
              >
                <View style={styles.previewWrap}>
                  {paper.document ? (
                    <PdfPreview uri={paper.document} style={styles.preview} />
                  ) : (
                    <Image
                      source={paper.image}
                      style={styles.preview}
                      contentFit="cover"
                    />
                  )}
                  <View style={styles.overlay} />
                  <View style={[styles.badge, { backgroundColor: "#43A047" }]}>
                    <Text style={styles.badgeText}>{exam}</Text>
                  </View>
                </View>
                <View style={styles.content}>
                  <Text style={styles.title}>{title}</Text>
                  <Text style={styles.meta}>{description}</Text>
                  <Text style={styles.meta}>{pagesText}</Text>
                  <Text style={styles.dateText}>Date: {dateText}</Text>
                  <View style={styles.footer}>
                    <Text style={styles.status}>Ready to download</Text>
                    <LinearGradient
                      colors={["#3B82F6", "#f65cee"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.downloadButton}
                    >
                      <Pressable accessibilityLabel={`Download ${title}`}>
                        <Icon name="download" size={15} color={colors.white} />
                      </Pressable>
                    </LinearGradient>
                  </View>
                </View>
              </Animated.View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  list: {
    width: "100%",
  },
  sectionBlock: {
    width: "100%",
    marginTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: spacing.sm,
    textTransform: "capitalize",
  },
  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: "hidden",
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    marginTop: spacing.sm,
  },
  cardWide: {
    maxWidth: 760,
  },
  previewWrap: { position: "relative", height: 200 },
  preview: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.2)" },
  badge: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "500" },
  content: { padding: spacing.sm },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
  },
  meta: {
    color: colors.subtitle,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  dateText: {
    color: colors.subtitle,
    fontSize: 12,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  status: { color: colors.text, fontSize: 12, fontWeight: "700" },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
