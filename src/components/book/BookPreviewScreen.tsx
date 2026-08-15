import { router, useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { auth, db } from "../../../firebaseConfig";
import { getHorizontalPadding } from "../../constants/layout";
import { recordUserActivity } from "../../services/activityService";
import { toggleSavedItem } from "../../services/userProfile";
import { ActionDialog } from "../ui/ActionDialog";
import { AuthorsCarousel } from "./AuthorsCarousel";
import { BookHero } from "./BookHero";
import { BookOverview } from "./BookOverview";
import { Book, normalizeKey, resolveAuthorAvatar } from "./bookTypes";
import { BottomActionBar } from "./BottomActionBar";
import { SimilarBooks } from "./SimilarBooks";

const gradients = [
  ["#57F287", "#2D9CFF"],
  ["#6A5AF9", "#D66BFF"],
  ["#FF6A88", "#FFB86B"],
  ["#00C9A7", "#0084FF"],
  ["#F857A6", "#FF5858"],
  ["#4FACFE", "#00F2FE"],
] as const;

const strings = (v: unknown) =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === "string")
    : typeof v === "string"
      ? [v]
      : [];

const asNumber = (v: unknown) =>
  typeof v === "number"
    ? v
    : typeof v === "string"
      ? Number(v) || undefined
      : undefined;

function mapBook(id: string, d: Record<string, unknown>): Book {
  return {
    id,
    title: typeof d.title === "string" ? d.title : "Untitled book",
    description:
      typeof d.description === "string"
        ? d.description
        : typeof d.summary === "string"
          ? d.summary
          : "",
    cover:
      typeof d.cover === "string" && d.cover.trim()
        ? d.cover.trim()
        : typeof d.image === "string" && d.image.trim()
          ? d.image.trim()
          : "",
    year:
      typeof d.year === "string" || typeof d.year === "number"
        ? String(d.year)
        : undefined,
    edition: typeof d.edition === "string" ? d.edition : undefined,
    author: strings(d.author),
    subject: strings(d.subject),
    pages:
      typeof d.pages === "string" || typeof d.pages === "number"
        ? String(d.pages)
        : typeof d.pageCount === "number"
          ? String(d.pageCount)
          : undefined,
    rating: asNumber(d.rating),
    saves: asNumber(d.savedBy ?? d.saves),
  };
}

export function BookPreviewScreen() {
  const { id, source, returnTo, teacherName } = useLocalSearchParams<{
    id: string;
    source?: string;
    returnTo?: string;
    teacherName?: string;
  }>();
  const [book, setBook] = useState<Book>();
  const [allBooks, setAllBooks] = useState<Book[]>([]);
  const [teacherAvatars, setTeacherAvatars] = useState<Record<string, string>>(
    {},
  );
  const [defaultUserAvatar, setDefaultUserAvatar] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [showGuestSaveAlert, setShowGuestSaveAlert] = useState(false);

  const [bookmarked, setBookmarked] = useState(false);
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);
  const [gradient] = useState(
    () => gradients[Math.floor(Math.random() * gradients.length)],
  );

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      try {
        if (auth.currentUser?.uid && id) {
          recordUserActivity(auth.currentUser.uid, "book", id);
        }

        const [selected, booksSnapshot, teachersSnapshot, defaultSnapshot] =
          await Promise.all([
            getDoc(doc(db, "books", id)),
            getDocs(collection(db, "books")),
            getDocs(collection(db, "teachers")),
            getDocs(collection(db, "default")),
          ]);

        if (!active) return;

        // Extract default user avatar from 'default' collection
        let defaultAvatar = "";
        defaultSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const docName =
            typeof data.name === "string" ? normalizeKey(data.name) : "";
          if (docName === "user" && typeof data.icon === "string") {
            defaultAvatar = data.icon.trim();
          }
        });
        setDefaultUserAvatar(defaultAvatar);

        // Map teacher names (normalized lowercase) to their avatar URLs
        const avatarsMap: Record<string, string> = {};
        teachersSnapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          if (
            typeof data.name === "string" &&
            typeof data.avatar === "string"
          ) {
            avatarsMap[normalizeKey(data.name)] = data.avatar.trim();
          }
        });
        setTeacherAvatars(avatarsMap);

        // Set Book Data
        setBook(
          selected.exists()
            ? mapBook(selected.id, selected.data() as Record<string, unknown>)
            : undefined,
        );
        setAllBooks(
          booksSnapshot.docs.map((d) =>
            mapBook(d.id, d.data() as Record<string, unknown>),
          ),
        );
      } catch (e) {
        console.error("Could not load book preview", e);
        if (active) {
          setBook(undefined);
          setAllBooks([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [id]);

  // Check if book is bookmarked and load bookmarked state
  useEffect(() => {
    if (!book || !auth.currentUser?.uid) return;

    const checkBookmarked = async () => {
      try {
        const userRef = doc(db, "users", auth.currentUser!.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          const savedBooks = Array.isArray(userData["saved-books"])
            ? userData["saved-books"]
            : [];
          setBookmarked(savedBooks.includes(book.id));
        }
      } catch (e) {
        console.error("Failed to check bookmark status", e);
      }
    };

    checkBookmarked();
  }, [book?.id]);

  const authorsWithAvatars = useMemo(() => {
    if (!book) return [];
    return book.author.map((authorName) => ({
      name: authorName,
      avatar: resolveAuthorAvatar(
        authorName,
        teacherAvatars,
        defaultUserAvatar,
      ),
    }));
  }, [book, teacherAvatars, defaultUserAvatar]);

  const similar = useMemo(
    () =>
      book
        ? allBooks
            .filter(
              (candidate) =>
                candidate.id !== book.id &&
                candidate.subject.some((subject) =>
                  book.subject.includes(subject),
                ),
            )
            .slice(0, 10)
        : [],
    [allBooks, book],
  );

  if (loading || !book)
    return (
      <View style={styles.loading} accessibilityLabel="Loading book preview">
        <View
          style={[
            styles.contentContainer,
            {
              maxWidth: contentMaxWidth,
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <View style={styles.skeletonHero} />
          <View style={styles.skeletonSheet}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineShort} />
            <View style={styles.skeletonAvatars} />
          </View>
        </View>
        <ActivityIndicator style={styles.loader} color="#147B5B" />
      </View>
    );
  const goBack = () => {
    if (
      typeof returnTo === "string" &&
      returnTo.trim() === "/teacher-profile" &&
      typeof teacherName === "string" &&
      teacherName.trim()
    ) {
      router.replace({
        pathname: "/teacher-profile",
        params: { name: teacherName.trim() },
      } as any);
      return;
    }

    if (typeof returnTo === "string" && returnTo.trim()) {
      router.replace(returnTo as any);
      return;
    }

    // Fallback based on source
    switch (source) {
      case "home":
        router.replace("/" as any);
        break;
      case "saved":
        router.replace("/profile" as any);
        break;
      case "activity":
        router.replace("/activity" as any);
        break;
      case "notifications":
        router.replace("/notifications" as any);
        break;
      case "search":
        router.replace("/search" as any);
        break;
      default:
        router.replace("/library" as any);
    }
  };

  return (
    <Animated.View
      key={id}
      entering={FadeIn.duration(260)}
      style={[styles.screen, { alignItems: "center" }]}
    >
      <View style={[styles.contentContainer, { maxWidth: contentMaxWidth }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 110, paddingHorizontal: horizontalPadding },
          ]}
        >
          <BookHero book={book} onBack={goBack} />
          <Animated.View
            entering={FadeInUp.duration(430)}
            style={[styles.sheet, { paddingHorizontal: 10 }]}
          >
            <BookOverview book={book} />
            <AuthorsCarousel authors={authorsWithAvatars} />
            <SimilarBooks
              books={similar}
              onSelect={(nextId) =>
                router.replace({
                  pathname: "/book-preview",
                  params: {
                    id: nextId,
                    source: source ?? "library",
                    returnTo:
                      typeof returnTo === "string"
                        ? returnTo
                        : source === "home"
                          ? "/"
                          : "/library",
                  },
                } as any)
              }
            />
          </Animated.View>
        </ScrollView>
      </View>
      <View style={styles.action}>
        <View
          style={[
            styles.actionContent,
            {
              maxWidth: contentMaxWidth,
              paddingHorizontal: horizontalPadding,
            },
          ]}
        >
          <BottomActionBar
            gradient={gradient}
            bookmarked={bookmarked}
            onBookmark={async () => {
              if (!book) return;

              if (!auth.currentUser?.uid) {
                setShowGuestSaveAlert(true);
                return;
              }

              try {
                await toggleSavedItem(
                  auth.currentUser.uid,
                  "saved-books",
                  book.id,
                  bookmarked,
                );
                setBookmarked((value) => !value);
              } catch (e) {
                console.error("Failed to toggle bookmark", e);
              }
            }}
          />
        </View>
      </View>

      <ActionDialog
        visible={showGuestSaveAlert}
        title="Save this resource"
        message="Log in or sign up to save books and resources for later."
        primaryText="Log in"
        secondaryText="Sign up"
        onPrimary={() =>
          router.push({
            pathname: "/login",
            params: {
              from:
                typeof returnTo === "string" && returnTo.trim()
                  ? returnTo
                  : "/",
            },
          } as any)
        }
        onSecondary={() =>
          router.push({
            pathname: "/signup",
            params: {
              from:
                typeof returnTo === "string" && returnTo.trim()
                  ? returnTo
                  : "/",
            },
          } as any)
        }
        onClose={() => setShowGuestSaveAlert(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { flexGrow: 1 },
  contentContainer: { flex: 1, width: "100%" },
  loading: { flex: 1, backgroundColor: "#fff", alignItems: "center" },
  skeletonHero: { height: "46%", backgroundColor: "#DDE4E2" },
  skeletonSheet: {
    flex: 1,
    marginTop: -28,
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#fff",
  },
  skeletonTitle: {
    width: 150,
    height: 22,
    borderRadius: 8,
    backgroundColor: "#E8EEEC",
    marginBottom: 20,
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EEF2F1",
    marginBottom: 11,
  },
  skeletonLineShort: {
    width: "62%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#EEF2F1",
  },
  skeletonAvatars: {
    width: 250,
    height: 64,
    marginTop: 42,
    borderRadius: 32,
    backgroundColor: "#E8EEEC",
  },
  loader: { position: "absolute", top: "50%", alignSelf: "center" },
  sheet: {
    marginTop: -28,
    paddingTop: 32,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "#fff",
    minHeight: 520,
  },
  action: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#fff",
    alignItems: "center",
  },
  actionContent: { width: "100%" },
});
