import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
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

type PastPaper = {
  id: string;
  title?: string;
  exam?: string;
  description?: string;
  date?: unknown;
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
  const [papers, setPapers] = useState<PastPaper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPastPapers = async () => {
      try {
        const papersRef = collection(db, "pastpapers");
        const papersQuery = query(papersRef, orderBy("date", "desc"));
        const snapshot = await getDocs(papersQuery);

        if (!isMounted) {
          return;
        }

        const fetchedPapers = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<PastPaper, "id">),
        }));

        setPapers(fetchedPapers);
      } catch (error) {
        console.error("Failed to load past papers", error);
        if (isMounted) {
          setPapers([]);
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

  if (papers.length === 0) {
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
      {papers.map((paper, index) => {
        const title = paper.title ?? "Past paper";
        const exam = paper.exam ?? "Exam";
        const description =
          paper.description ?? "Study resource available for download.";
        const dateText = formatDate(paper.date);

        return (
          <Animated.View
            key={paper.id}
            entering={FadeInUp.duration(580 + index * 80)}
            style={[styles.card, isWide && styles.cardWide]}
          >
            <View style={styles.previewWrap}>
              <Image
                source={require("../../../assets/images/pdf-preview.jpeg")}
                style={styles.preview}
                contentFit="cover"
              />
              <View style={styles.overlay} />
              <View style={[styles.badge, { backgroundColor: "#43A047" }]}>
                <Text style={styles.badgeText}>{exam}</Text>
              </View>
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.meta}>{description}</Text>
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
  );
};

const styles = StyleSheet.create({
  list: {
    width: "100%",
  },
  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: "hidden",
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
    marginTop: spacing.lg,
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
