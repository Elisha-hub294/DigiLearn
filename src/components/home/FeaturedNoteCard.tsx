import { Feather as Icon, Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
import { Image } from "expo-image";
import * as IntentLauncher from "expo-intent-launcher";
import { usePathname, useRouter } from "expo-router";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
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
import { useProfile } from "../../contexts/ProfileContext";
import { toggleSavedItem } from "../../services/userProfile";
import PdfPreview from "./PdfPreview";

type TopicalNote = {
  id: string;
  title?: string;
  description?: string;
  subject?: string | string[];
  author?: string;
  preview?: string;
  document?: string;
  book?: string | string[];
  updatedAt?: any;
  level?: string;
  readStatus?: string;
  isRead?: boolean;
  progress?: number;
};

type FeaturedNoteCardProps = {
  subject?: string;
  hideAvatar?: boolean;
  notes?: Array<{
    id: string;
    title?: string;
    description?: string;
    subject?: string | string[];
    author?: string;
    preview?: string;
    document?: string;
    book?: string | string[];
    updatedAt?: any;
    level?: string;
    readStatus?: string;
    isRead?: boolean;
    progress?: number;
  }>;
  loading?: boolean;
  source?: "home" | "library" | "pages";
};

const normalizeKey = (str: string) => str.trim().toLowerCase();

const openPdfDocument = async (url: string) => {
  if (!url) return;

  if (Platform.OS === "android") {
    try {
      const filename = url.split("/").pop()?.split("?")[0] || "document.pdf";
      const cacheDir =
        (FileSystem as any).cacheDirectory ||
        (FileSystem as any).documentDirectory ||
        "";
      const localUri = `${cacheDir}${Date.now()}_${filename}`;

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
  subject,
  hideAvatar = false,
  notes: providedNotes,
  loading: externalLoading,
  source = "home",
}: FeaturedNoteCardProps) => {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;
  const [notes, setNotes] = useState<TopicalNote[]>([]);
  const [subjectAvatars, setSubjectAvatars] = useState<Record<string, string>>(
    {},
  );
  const [defaultAvatar, setDefaultAvatar] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadMetadata = async () => {
      const [notesSnap, subjectsSnap, defaultSnap] = await Promise.all([
        getDocs(query(collection(db, "pages"), orderBy("updatedAt", "desc"))),
        getDocs(collection(db, "subject")),
        getDocs(collection(db, "default")),
      ]);

      if (!active) return;

      let userDefaultIcon = "";
      defaultSnap.docs.forEach((d) => {
        const data = d.data();
        if (
          typeof data.name === "string" &&
          normalizeKey(data.name) === "user" &&
          typeof data.icon === "string"
        ) {
          userDefaultIcon = data.icon.trim();
        }
      });
      setDefaultAvatar(userDefaultIcon);

      const subjectMap: Record<string, string> = {};
      subjectsSnap.docs.forEach((d) => {
        const data = d.data();
        if (typeof data.name === "string" && typeof data.avatar === "string") {
          subjectMap[normalizeKey(data.name)] = data.avatar.trim();
        }
      });
      setSubjectAvatars(subjectMap);

      const allNotes = notesSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as TopicalNote,
      );
      const filteredNotes = subject
        ? allNotes.filter((note) => {
          const noteSubjects = Array.isArray(note.subject)
            ? note.subject
            : [note.subject ?? ""];
          return noteSubjects.some(
            (entry) => normalizeKey(entry) === normalizeKey(subject),
          );
        })
        : allNotes;

      if (providedNotes) {
        setNotes(providedNotes);
      } else {
        setNotes(filteredNotes);
      }
    };

    if (providedNotes) {
      setNotes(providedNotes);
      setLoading(Boolean(externalLoading));
      loadMetadata().catch((e) => {
        console.error("Error loading featured note metadata:", e);
        if (active) setNotes([]);
      });
      return () => {
        active = false;
      };
    }

    setLoading(true);
    loadMetadata()
      .catch((e) => {
        console.error("Error loading featured notes:", e);
        if (active) setNotes([]);
      })
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [externalLoading, providedNotes, subject]);

  const listData = useMemo(() => notes, [notes]);

  if (loading || externalLoading) {
    return (
      <View style={[styles.list, isWide && styles.listWide]}>
        <SkeletonNoteCard isWide={isWide} />
      </View>
    );
  }

  if (!listData.length) return null;

  return (
    <View style={[styles.list, isWide && styles.listWide]}>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <FeaturedNoteItem
            note={item}
            subjectAvatars={subjectAvatars}
            defaultAvatar={defaultAvatar}
            isWide={isWide}
            source={source}
            subject={subject}
            hideAvatar={hideAvatar}
          />
        )}
      />
    </View>
  );
};

const SkeletonNoteCard = ({ isWide }: { isWide: boolean }) => {
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
    <View style={[styles.itemWrapper, isWide && styles.itemWrapperWide]}>
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
  subjectAvatars,
  defaultAvatar,
  isWide,
  source,
  subject,
  hideAvatar,
}: {
  note: TopicalNote;
  subjectAvatars: Record<string, string>;
  defaultAvatar: string;
  isWide: boolean;
  source: "home" | "library" | "pages";
  subject?: string;
  hideAvatar?: boolean;
}) => {
  const { user, profile } = useProfile();
  const [hovered, setHovered] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const title = note.title ?? "Featured note";
  const description =
    (note.description?.length ?? 0) > 100
      ? `${note.description?.slice(0, 100)}...`
      : (note.description ?? "A fresh study note will appear here.");

  const isSaved = Boolean(user && profile?.["saved-pages"]?.includes(note.id));

  const handleToggleSave = async () => {
    if (!user) {
      router.push("/welcome");
      return;
    }
    try {
      await toggleSavedItem(user.uid, "saved-pages", note.id, isSaved);
    } catch (err) {
      console.error("Failed to toggle saved note:", err);
    }
  };

  const subjectValues = Array.isArray(note.subject)
    ? note.subject
    : note.subject
      ? [note.subject]
      : [];
  const avatarUri =
    subjectValues
      .map((entry) => normalizeKey(entry))
      .map((entry) => subjectAvatars[entry])
      .find(Boolean) ||
    (subject ? subjectAvatars[normalizeKey(subject)] : undefined) ||
    defaultAvatar ||
    undefined;

  const previewSource = source ?? "home";
  const routeTitle =
    typeof subject === "string" && subject.trim().length > 0
      ? subject
      : typeof note.subject === "string" && note.subject.trim().length > 0
        ? note.subject
        : "Pages";
  const subjectName =
    typeof subject === "string" && subject.trim().length > 0
      ? subject
      : (subjectValues.find(Boolean) ?? routeTitle);

  return (
    <Animated.View
      entering={FadeInUp.duration(420)}
      style={[styles.itemWrapper, isWide && styles.itemWrapperWide]}
    >
      <View
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        style={[styles.card, hovered && styles.cardHovered]}
      >
        <Pressable
          style={styles.previewWrap}
          onHoverIn={() => setHovered(true)}
          onHoverOut={() => setHovered(false)}
          onPress={() =>
            router.push({
              pathname: "/page-preview",
              params: {
                id: note.id,
                source: previewSource,
                returnTo: pathname,
                title: routeTitle,
              },
            } as any)
          }
        >
          {note.preview ? (
            <Image
              source={{ uri: note.preview }}
              style={styles.preview}
              contentFit="cover"
              contentPosition="top"
              transition={150}
              placeholder={require("../../../assets/images/pdf-preview.jpeg")}
            />
          ) : note.document ? (
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
          {/* {!hideAvatar && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open ${subjectName} profile`}
              onPress={() =>
                router.push({
                  pathname: "/subject-profile",
                  params: { subject: subjectName },
                } as any)
              }
              style={styles.avatarPressable}
            >
              <Image
                source={avatarUri ? { uri: avatarUri } : undefined}
                style={styles.avatar}
                contentFit="cover"
              />
            </Pressable>
          )} */}
          <View
            style={[
              styles.contentData,
              hideAvatar && styles.contentDataNoAvatar,
            ]}
          >
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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isSaved ? "Remove bookmark" : "Save note"}
            style={styles.actionItem}
            onPress={handleToggleSave}
          >
            <Ionicons
              name={isSaved ? "bookmark" : "bookmark-outline"}
              size={20}
              color={isSaved ? colors.primary : colors.subtitle}
            />
          </Pressable>
          <Action icon="share-2" label="Share" />
        </View>
      </View>
    </Animated.View>
  );
};

const Action = ({ icon, label }: { icon: any; label: string }) => (
  <View style={styles.actionItem}>
    <Icon name={icon} size={20} color={colors.subtitle} />
  </View>
);

const styles = StyleSheet.create({
  list: { width: "100%" },
  listContent: { paddingBottom: spacing.xl },
  listWide: { flexDirection: "column", gap: spacing.md },
  itemWrapper: { width: "100%" },
  itemWrapperWide: { width: "100%" },
  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.white,
    marginBottom: spacing.xl,
    borderRadius: 10
  },
  cardHovered: {
    backgroundColor: "#e8efffff",
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f6f8fb",
  },
  avatarPressable: {
    marginRight: spacing.sm,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8EDF0",
  },
  previewWrap: {
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.xs,
    borderRadius: 10
  },
  preview: {
    width: "100%",
    height: 320,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  content: {
    flexDirection: "row",
    paddingHorizontal: spacing.xs,
  },
  contentData: { flex: 1 },
  contentDataNoAvatar: { marginLeft: 0 },
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
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 3,
    borderRadius: 999,
  },
  actionLabel: { color: colors.subtitle, fontSize: 12, fontWeight: "500" },
  skeletonBox: { backgroundColor: "#EFEFEF", borderRadius: radius.sm },
  skeletonPreview: { height: 250, marginBottom: spacing.sm },
  skeletonTitle: { height: 16, width: "60%", marginBottom: 8 },
  skeletonDesc: { height: 12, width: "90%", marginBottom: 6 },
  skeletonDescShort: { height: 12, width: "40%" },
});
