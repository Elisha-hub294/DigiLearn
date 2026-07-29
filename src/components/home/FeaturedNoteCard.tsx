import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useState } from "react";
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
import { colors, spacing } from "../../constants/theme";
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
      <View style={[styles.stateCard, isWide && styles.stateCardWide]}>
        <Text style={styles.stateTitle}>Loading notes...</Text>
      </View>
    );
  }

  if (notes.length === 0) {
    return (
      <View style={[styles.stateCard, isWide && styles.stateCardWide]}>
        <Text style={styles.stateTitle}>No notes available yet</Text>
      </View>
    );
  }

  return (
    <View style={[styles.list, isWide && styles.listWide]}>
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
    <Animated.View
      entering={FadeInUp.duration(420)}
      style={[styles.itemWrapper, isWide && styles.itemWrapperWide]}
    >
      <Pressable
        {...({
          onHoverIn: () => setIsHovered(true),
          onHoverOut: () => setIsHovered(false),
        } as any)}
        style={({ pressed, hovered }: any) => [
          styles.card,
          (pressed || hovered || isHovered) && {
            backgroundColor: "#e9efff",
            borderWidth: 1,
            borderColor: "#dfe8ff",
          },
        ]}
      >
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
          <Pressable
            accessibilityLabel="More options"
            style={styles.menuButton}
          >
            <Icon name="more-vertical" size={18} color={colors.subtitle} />
          </Pressable>
        </View>
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
  listWide: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  itemWrapper: {
    width: "100%",
  },
  itemWrapperWide: {
    width: "48%",
  },
  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.white,
    marginBottom: spacing.xl,
    borderRadius: 24,
    padding: 8,
    borderColor: "#eff4ff",
    borderWidth: 1,
  },
  stateCard: {
    width: "100%",
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderRadius: 24,
    borderColor: "#eff4ff",
    borderWidth: 1,
  },
  stateCardWide: {
    maxWidth: 760,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f8fb",
  },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: spacing.sm },
  previewWrap: {
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.sm,
    borderRadius: 18,
  },
  preview: { width: "100%", height: 400 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.12)" },
  content: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  contentData: {
    flex: 1,
  },
  stateTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  description: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 18,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
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
