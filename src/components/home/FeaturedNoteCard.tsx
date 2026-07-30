import { Feather as Icon } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import * as IntentLauncher from "expo-intent-launcher";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  Linking,
  Platform,
  Pressable,
  Animated as RNAnimated,
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
  subject?: string;
  document?: string;
};

const AVATARS: Record<string, string> = {
  Mathematics: "math",
  Physics: "phy",
  Biology: "bio",
  Chemistry: "chem",
  Art: "art",
  Economics: "econ",
  Entrepreneurship: "ent",
  Computer: "ict",
  Geography: "geo",
  History: "hist",
  English: "lang",
};

const getAvatar = (sub?: string) =>
  `https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons/${AVATARS[sub || ""] || "default"}-2d.png`;

const openPdfDocument = async (url: string) => {
  if (!url) return;

  if (Platform.OS === "android") {
    try {
      const filename = url.split("/").pop()?.split("?")[0] || "document.pdf";
      const localUri = `${FileSystem.cacheDirectory}${Date.now()}_${filename}`;

      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      const contentUri = await FileSystem.getContentUriAsync(
        downloadResult.uri,
      );

      await IntentLauncher.startActivityAsync("android.intent.action.VIEW", {
        data: contentUri,
        type: "application/pdf",
        flags: 1,
      });
    } catch (error) {
      console.error(
        "Failed to launch intent, opening in fallback browser:",
        error,
      );
      Linking.openURL(url).catch(console.error);
    }
  } else {
    Linking.openURL(url).catch(console.error);
  }
};

export const FeaturedNoteCard = ({
  layout = "stack",
}: {
  layout?: "stack" | "two-column";
}) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const useTwoColumns = isWide && layout === "two-column";
  const [notes, setNotes] = useState<TopicalNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getDocs(
      query(collection(db, "topicalNotesCards"), orderBy("createdAt", "desc")),
    )
      .then(
        (snap) =>
          active &&
          setNotes(
            snap.docs.map((d) => ({ id: d.id, ...d.data() }) as TopicalNote),
          ),
      )
      .catch(() => active && setNotes([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    const skeletonCount = useTwoColumns ? 2 : 1;
    return (
      <View
        style={[
          styles.list,
          useTwoColumns ? styles.listTwoColumns : isWide && styles.listWide,
        ]}
      >
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonNoteCard
            key={index}
            isWide={useTwoColumns}
            layout={layout}
          />
        ))}
      </View>
    );
  }

  if (!notes.length) return null;

  return (
    <View
      style={[
        styles.list,
        useTwoColumns ? styles.listTwoColumns : isWide && styles.listWide,
      ]}
    >
      {notes.map((note) => (
        <FeaturedNoteItem
          key={note.id}
          note={note}
          isWide={useTwoColumns}
          layout={layout}
        />
      ))}
    </View>
  );
};

const SkeletonNoteCard = ({
  isWide,
  layout,
}: {
  isWide: boolean;
  layout: string;
}) => {
  const pulseAnim = useRef(new RNAnimated.Value(0.3)).current;

  useEffect(() => {
    const pulse = RNAnimated.loop(
      RNAnimated.sequence([
        RNAnimated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        RNAnimated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View
      style={[
        styles.itemWrapper,
        isWide &&
          (layout === "two-column"
            ? styles.itemWrapperTwoColumns
            : styles.itemWrapperWide),
      ]}
    >
      <View style={styles.card}>
        <RNAnimated.View
          style={[
            styles.previewWrap,
            styles.skeletonBox,
            styles.skeletonPreview,
            { opacity: pulseAnim },
          ]}
        />
        <View style={styles.content}>
          <RNAnimated.View
            style={[styles.avatar, styles.skeletonBox, { opacity: pulseAnim }]}
          />
          <View style={styles.contentData}>
            <RNAnimated.View
              style={[
                styles.skeletonBox,
                styles.skeletonTitle,
                { opacity: pulseAnim },
              ]}
            />
            <RNAnimated.View
              style={[
                styles.skeletonBox,
                styles.skeletonDesc,
                { opacity: pulseAnim },
              ]}
            />
            <RNAnimated.View
              style={[
                styles.skeletonBox,
                styles.skeletonDescShort,
                { opacity: pulseAnim },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const FeaturedNoteItem = ({
  note,
  isWide,
  layout,
}: {
  note: TopicalNote;
  isWide: boolean;
  layout: string;
}) => {
  const [hovered, setHovered] = useState(false);
  const title = note.title ?? "Featured note";
  const description =
    (note.description?.length ?? 0) > 100
      ? `${note.description?.slice(0, 100)}...`
      : (note.description ?? "A fresh study note will appear here.");

  return (
    <Animated.View
      entering={FadeInUp.duration(420)}
      style={[
        styles.itemWrapper,
        isWide &&
          (layout === "two-column"
            ? styles.itemWrapperTwoColumns
            : styles.itemWrapperWide),
      ]}
    >
      <Pressable
        onHoverIn={() => setHovered(true)}
        onHoverOut={() => setHovered(false)}
        style={({ pressed }) => [
          styles.card,
          (pressed || hovered) && styles.cardHovered,
        ]}
      >
        <Pressable
          style={styles.previewWrap}
          onPress={() => note.document && openPdfDocument(note.document)}
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
            source={{ uri: getAvatar(note.subject) }}
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
  list: { width: "100%" },
  listWide: { flexDirection: "column", gap: spacing.md },
  listTwoColumns: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  itemWrapper: { width: "100%" },
  itemWrapperWide: { width: "100%" },
  itemWrapperTwoColumns: { width: "48%" },
  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.white,
    marginBottom: spacing.xl,
    borderRadius: radius.lg,
    padding: 8,
    borderColor: "#ffffff",
    borderWidth: 1,
  },
  cardHovered: {
    backgroundColor: "#f0f0f0",
    borderWidth: 1,
    borderColor: "#d8d8d8",
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
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  preview: { width: "100%", height: 250 },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  content: {
    flexDirection: "row",
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  contentData: { flex: 1 },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 4,
  },
  description: { color: colors.text, fontSize: 13, lineHeight: 18 },
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
  skeletonBox: { backgroundColor: "#EFEFEF", borderRadius: radius.sm },
  skeletonPreview: { height: 250, marginBottom: spacing.sm },
  skeletonTitle: { height: 16, width: "60%", marginBottom: 8 },
  skeletonDesc: { height: 12, width: "90%", marginBottom: 6 },
  skeletonDescShort: { height: 12, width: "40%" },
});
