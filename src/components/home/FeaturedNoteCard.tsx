import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
  Linking,
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

type TopicalNote = {
  id: string;
  title?: string;
  description?: string;
  createdAt?: unknown;
  subject?: string;
  document?: string;
};

const getSubjectAvatar = (subject?: string) => {
  switch (subject) {
    case "Mathematics":
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/math-2d.png";
    case "Physics":
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/phy-2d.png";
    case "Biology":
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/bio-2d.png";
    case "Chemistry":
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/chem-2d.png";
    case "Art":
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/art-2d.png";
    case "Economics":
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/econ-2d.png";
    case "Entrepreneurship":
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/ent-2d.png";
    case "Computer":
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/ict-2d.png";
    case "Geography":
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/geo-2d.png";
    case "History":
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/hist-2d.png";
    case "English":
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/lang-2d.png";
    default:
      return "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/default-2d.png";
  }
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
  const [notes, setNotes] = useState<TopicalNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchFeaturedNotes = async () => {
      try {
        const notesRef = collection(db, "topicalNotesCards");
        const noteQuery = query(notesRef, orderBy("createdAt", "desc"));
        const snapshot = await getDocs(noteQuery);

        if (!isMounted) {
          return;
        }

        const fetchedNotes = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<TopicalNote, "id">),
        }));

        setNotes(fetchedNotes);
      } catch (error) {
        console.error("Failed to load featured notes", error);
        if (isMounted) {
          setNotes([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchFeaturedNotes();

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.card, isWide && styles.cardWide]}>
        <Text style={styles.title}>Loading notes...</Text>
      </View>
    );
  }

  if (notes.length === 0) {
    return (
      <View style={[styles.card, isWide && styles.cardWide]}>
        <Text style={styles.title}>No notes available yet</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {notes.map((note) => (
        <FeaturedNoteItem key={note.id} note={note} isWide={isWide} />
      ))}
    </View>
  );
};

const FeaturedNoteItem = ({
  note,
  isWide,
}: {
  note: TopicalNote;
  isWide: boolean;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const title = note.title ?? "Featured note";
  const description =
    (note.description?.length ?? 0) > 100
      ? `${note.description?.slice(0, 100)}...`
      : (note.description ?? "A fresh study note will appear here.");

  return (
    <Animated.View entering={FadeInUp.duration(420)} style={{ width: "100%" }}>
      <Pressable
        {...({
          onHoverIn: () => setIsHovered(true),
          onHoverOut: () => setIsHovered(false),
        } as any)}
        style={({ pressed, hovered }: any) => [
          styles.card,
          isWide && styles.cardWide,
          (pressed || hovered || isHovered) && {
            backgroundColor: "#f0f0f0",
            borderWidth: 1,
            borderColor: "#d8d8d8",
          },
        ]}
      >
        <View style={styles.content}>
          <Image
            source={{ uri: getSubjectAvatar(note.subject) }}
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.contentData}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
        <Pressable
          {...({
            onHoverIn: () => setIsHovered(true),
            onHoverOut: () => setIsHovered(false),
          } as any)}
          style={styles.previewWrap}
          onPress={() => {
            if (note.document) {
              Linking.openURL(note.document).catch((err) =>
                console.error("Couldn't load page", err),
              );
            }
          }}
        >
          {note.document ? (
            <PdfPreview uri={note.document} style={styles.preview} />
          ) : (
            <Image
              source={require("../../../assets/images/pdf-preview.jpeg")}
              style={styles.preview}
              contentFit="cover"
            />
          )}
          <View style={styles.overlay} />
        </Pressable>
        <View style={styles.actions}>
          <Action icon="star" label="Like" />
          <Action icon="bookmark" label="Save" />
          <Action icon="share-2" label="Share" />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const Action = ({ icon, label }: { icon: any; label: string }) => (
  <View style={styles.actionItem}>
    <Icon name={icon} size={15} color={colors.subtitle} />
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  list: {
    width: "100%",
  },
  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.white,
    marginBottom: spacing.xl,
    padding: 7,
    borderRadius: 25,
    borderColor: "#fff",
    borderWidth: 1,
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
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.xs,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },
  preview: { width: "100%", height: 220 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.1)" },
  content: {
    flexDirection: "row",
  },
  contentData: {
    width: "80%",
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
  },
  description: {
    color: colors.subtitle,
    fontSize: 13,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: 8,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: colors.background,
  },
  actionLabel: { color: colors.subtitle, fontSize: 12, fontWeight: "500" },
});
