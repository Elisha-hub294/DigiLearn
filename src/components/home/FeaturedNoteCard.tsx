import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { collection, getDocs, limit, orderBy, query } from "firebase/firestore";
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
import { colors, spacing } from "../../constants/theme";

type TopicalNote = {
  id: string;
  title?: string;
  description?: string;
  createdAt?: unknown;
};

const formatCreatedAt = (value: unknown) => {
  if (!value) {
    return "Recently added";
  }

  if (typeof value === "object" && value !== null && "toDate" in value) {
    const date = (value as { toDate: () => Date }).toDate();
    return `Updated ${date.toLocaleDateString()}`;
  }

  if (value instanceof Date) {
    return `Updated ${value.toLocaleDateString()}`;
  }

  if (typeof value === "string") {
    return `Updated ${new Date(value).toLocaleDateString()}`;
  }

  return "Recently added";
};

export const FeaturedNoteCard = () => {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [note, setNote] = useState<TopicalNote | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchFeaturedNote = async () => {
      try {
        const notesRef = collection(db, "topicalNotesCards");
        const noteQuery = query(
          notesRef,
          orderBy("createdAt", "desc"),
          limit(1),
        );
        const snapshot = await getDocs(noteQuery);

        if (!isMounted) {
          return;
        }

        const doc = snapshot.docs[0];
        if (doc) {
          setNote({ id: doc.id, ...(doc.data() as Omit<TopicalNote, "id">) });
        } else {
          setNote(null);
        }
      } catch (error) {
        console.error("Failed to load featured note", error);
        if (isMounted) {
          setNote(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedNote();

    return () => {
      isMounted = false;
    };
  }, []);

  const title = note?.title ?? "Featured note";
  const description =
    note?.description ?? "A fresh study note will appear here.";
  const metaText = loading
    ? "Loading note..."
    : note
      ? formatCreatedAt(note.createdAt)
      : "No note available yet";

  return (
    <Animated.View
      entering={FadeInUp.duration(420)}
      style={[styles.card, isWide && styles.cardWide]}
    >
      <View style={styles.previewWrap}>
        <Image
          source={require("../../../assets/images/pdf-preview.jpeg")}
          style={styles.preview}
          contentFit="cover"
        />
        <View style={styles.overlay} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>Topical note</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>{metaText}</Text>
          </View>
          <LinearGradient
            colors={["#3B82F6", "#f65cee"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.downloadButton}
          >
            <Pressable accessibilityLabel="Download featured note">
              <Icon name="download" size={16} color={colors.white} />
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  cardWide: {
    maxWidth: 760,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: spacing.sm },
  teacher: { color: colors.text, fontSize: 13, fontWeight: "700" },
  subject: { color: colors.subtitle, fontSize: 12, marginTop: 2 },
  previewWrap: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.md,
  },
  preview: { width: "100%", height: 220 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.2)" },
  content: {},
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "500",
    marginBottom: 6,
  },
  description: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },
  meta: { color: colors.subtitle, fontSize: 11, fontWeight: "600" },
  dot: { color: colors.subtitle, marginHorizontal: 6 },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
});
