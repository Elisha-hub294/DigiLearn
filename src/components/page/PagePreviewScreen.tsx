import { router, useLocalSearchParams } from "expo-router";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { auth, db } from "../../../firebaseConfig";
import { getHorizontalPadding } from "../../constants/layout";
import { recordUserActivity } from "../../services/activityService";
import { toggleSavedItem } from "../../services/userProfile";
import { FALLBACK_COVER } from "../book/bookTypes";
import { ActionDialog } from "../ui/ActionDialog";
import { BottomActionBar } from "./BottomActionBar";
import { OverviewSection } from "./OverviewSection";
import { PageHero } from "./PageHero";
import { DEFAULT_SUBJECT_AVATAR, SourceBook, TopicalNote } from "./pageTypes";
import { SimilarPages } from "./SimilarPages";
import { SourceBooks } from "./SourceBooks";
import { SubjectBadge } from "./SubjectBadge";

const normalizeArray = (val: unknown): string[] => {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.filter(
      (x): x is string => typeof x === "string" && x.trim().length > 0,
    );
  }
  if (typeof val === "string" && val.trim()) {
    return [val.trim()];
  }
  return [];
};

function formatDate(createdAt: any): string {
  if (!createdAt) return "Last updated • 2025";
  try {
    let date: Date | null = null;
    if (
      typeof createdAt === "object" &&
      typeof createdAt.seconds === "number"
    ) {
      date = new Date(createdAt.seconds * 1000);
    } else if (createdAt instanceof Date) {
      date = createdAt;
    } else if (typeof createdAt === "string" || typeof createdAt === "number") {
      date = new Date(createdAt);
    }

    if (date && !isNaN(date.getTime())) {
      const year = date.getFullYear();
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const day = date.getDate();
      const monthStr = monthNames[date.getMonth()];
      return `Updated ${day} ${monthStr} ${year}`;
    }
  } catch {
    // fallback below
  }
  return "Last updated • 2025";
}

const extractAccentColor = (rawAccent: unknown): string => {
  if (!rawAccent) return "#000000";
  if (typeof rawAccent === "string" && rawAccent.trim()) {
    const trimmed = rawAccent.trim();
    if (
      trimmed.startsWith("#") ||
      trimmed.startsWith("rgb") ||
      trimmed.toLowerCase() === "black"
    ) {
      return trimmed;
    }
    if (/^[0-9A-Fa-f]{6}$/.test(trimmed) || /^[0-9A-Fa-f]{3}$/.test(trimmed)) {
      return `#${trimmed}`;
    }
    return trimmed;
  }
  if (typeof rawAccent === "object" && rawAccent !== null) {
    const obj = rawAccent as Record<string, unknown>;
    if (typeof obj.color === "string" && obj.color.trim()) {
      return obj.color.trim();
    }
    if (typeof obj.hex === "string" && obj.hex.trim()) {
      return obj.hex.trim();
    }
  }
  return "#000000";
};

export function PagePreviewScreen() {
  const { id, source, returnTo, title } = useLocalSearchParams<{
    id: string;
    source?: "home" | "library" | "pages" | "activity";
    returnTo?: string;
    title?: string;
  }>();

  const [note, setNote] = useState<TopicalNote>();
  const [allNotes, setAllNotes] = useState<TopicalNote[]>([]);
  const [sourceBooks, setSourceBooks] = useState<SourceBook[]>([]);
  const [subjectAvatar, setSubjectAvatar] = useState<string>(
    DEFAULT_SUBJECT_AVATAR,
  );
  const [subjectAccent, setSubjectAccent] = useState<string>("#000000");
  const [loading, setLoading] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [showGuestSaveAlert, setShowGuestSaveAlert] = useState(false);

  const { width } = useWindowDimensions();
  const horizontalPadding = width < 600 ? 0 : getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);

  useEffect(() => {
    let active = true;
    setLoading(true);

    (async () => {
      try {
        if (!id) return;

        if (auth.currentUser?.uid) {
          recordUserActivity(auth.currentUser.uid, "page", id);
        }

        const [selectedSnap, notesSnap, booksSnap, subjectsSnap] =
          await Promise.all([
            getDoc(doc(db, "pages", id)),
            getDocs(collection(db, "pages")),
            getDocs(collection(db, "books")),
            getDocs(collection(db, "subject")),
          ]);

        if (!active) return;

        let currentDoc: TopicalNote | undefined;
        if (selectedSnap.exists()) {
          const data = selectedSnap.data() as Record<string, unknown>;
          currentDoc = {
            id: selectedSnap.id,
            title:
              typeof data.title === "string" ? data.title : "Untitled note",
            description:
              typeof data.description === "string" ? data.description : "",
            preview:
              typeof data.preview === "string" ? data.preview : undefined,
            document:
              typeof data.document === "string" ? data.document : undefined,
            createdAt: data.createdAt,
            subject: normalizeArray(data.subject),
            book: normalizeArray(data.book),
            pages: (data.pages ?? data.pageCount ?? data.pagesCount) as
              | string
              | number,
            isRecommended: Boolean(data.isRecommended || data.featured),
          };
          setNote(currentDoc);
        }

        // Map all notes for Similar Pages
        const mappedNotes: TopicalNote[] = notesSnap.docs.map((d) => {
          const data = d.data() as Record<string, unknown>;
          return {
            id: d.id,
            title:
              typeof data.title === "string" ? data.title : "Untitled note",
            description:
              typeof data.description === "string" ? data.description : "",
            preview:
              typeof data.preview === "string" ? data.preview : undefined,
            document:
              typeof data.document === "string" ? data.document : undefined,
            createdAt: data.createdAt,
            subject: normalizeArray(data.subject),
            book: normalizeArray(data.book),
            pages: (data.pages ?? data.pageCount) as string | number,
          };
        });
        setAllNotes(mappedNotes);

        // Subject Avatar & Accent Lookup
        const currentSubjects = currentDoc?.subject
          ? normalizeArray(currentDoc.subject)
          : [];
        let matchedAvatar = DEFAULT_SUBJECT_AVATAR;
        let matchedAccent = "#000000";

        if (currentSubjects.length > 0 && !subjectsSnap.empty) {
          const subjectDocs = subjectsSnap.docs.map((s) => {
            const sData = s.data() as Record<string, unknown>;
            return {
              name: (sData.name as string)?.trim().toLowerCase(),
              avatar: sData.avatar as string,
              accent: extractAccentColor(sData.accent),
            };
          });

          for (const subName of currentSubjects) {
            const match = subjectDocs.find(
              (s) => s.name && s.name === subName.trim().toLowerCase(),
            );
            if (match) {
              if (match.avatar) matchedAvatar = match.avatar;
              if (match.accent) matchedAccent = match.accent;
              break;
            }
          }
        }
        setSubjectAvatar(matchedAvatar);
        setSubjectAccent(matchedAccent);

        // Source Books Lookup
        const pageBookTitles = currentDoc?.book
          ? normalizeArray(currentDoc.book)
          : [];
        if (pageBookTitles.length > 0 && !booksSnap.empty) {
          const matchedBooks: SourceBook[] = [];
          booksSnap.docs.forEach((bDoc) => {
            const bData = bDoc.data() as Record<string, unknown>;
            const bTitle = typeof bData.title === "string" ? bData.title : "";
            const isMatch = pageBookTitles.some(
              (pTitle) =>
                pTitle.trim().toLowerCase() === bTitle.trim().toLowerCase() ||
                bTitle.toLowerCase().includes(pTitle.toLowerCase()),
            );
            if (isMatch) {
              matchedBooks.push({
                id: bDoc.id,
                title: bTitle || "Book",
                cover:
                  typeof bData.cover === "string"
                    ? bData.cover
                    : typeof bData.image === "string"
                      ? bData.image
                      : FALLBACK_COVER,
                author:
                  typeof bData.author === "string" ? bData.author : undefined,
              });
            }
          });
          setSourceBooks(matchedBooks);
        } else {
          setSourceBooks([]);
        }
      } catch (error) {
        console.error("Could not load page preview", error);
        if (active) {
          setNote(undefined);
          setAllNotes([]);
          setSourceBooks([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    let active = true;

    const loadBookmarkState = async () => {
      const userId = auth.currentUser?.uid;
      if (!id || !userId) {
        if (active) setBookmarked(false);
        return;
      }

      try {
        const userSnap = await getDoc(doc(db, "users", userId));
        const savedPages = Array.isArray(userSnap.data()?.["saved-pages"])
          ? userSnap.data()?.["saved-pages"]
          : [];

        if (active) setBookmarked(savedPages.includes(id));
      } catch (error) {
        console.error("Failed to check page bookmark status", error);
      }
    };

    loadBookmarkState();
    return () => {
      active = false;
    };
  }, [id]);

  // Compute Similar Pages by subject overlap (excluding current note)
  const similarPages = useMemo(() => {
    if (!note) return [];
    const currentSubjects = normalizeArray(note.subject);
    if (currentSubjects.length === 0) return [];

    return allNotes
      .filter((candidate) => {
        if (candidate.id === note.id) return false;
        const candidateSubjects = normalizeArray(candidate.subject);
        return candidateSubjects.some((sub) =>
          currentSubjects.some(
            (cSub) => cSub.trim().toLowerCase() === sub.trim().toLowerCase(),
          ),
        );
      })
      .slice(0, 10);
  }, [allNotes, note]);

  const dateFormatted = useMemo(
    () => formatDate(note?.createdAt),
    [note?.createdAt],
  );

  const isRecentlyUpdated = useMemo(() => {
    if (!note?.createdAt) return false;
    try {
      let d: Date | null = null;
      if (
        typeof note.createdAt === "object" &&
        typeof note.createdAt.seconds === "number"
      ) {
        d = new Date(note.createdAt.seconds * 1000);
      } else if (note.createdAt instanceof Date) {
        d = note.createdAt;
      }
      if (d) {
        const diffMs = Date.now() - d.getTime();
        return diffMs <= 30 * 24 * 60 * 60 * 1000;
      }
    } catch {
      // ignore
    }
    return false;
  }, [note?.createdAt]);

  if (loading || !note) {
    return (
      <View
        style={[styles.loadingContainer, { alignItems: "center" }]}
        accessibilityLabel="Loading page preview"
      >
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
            <View style={styles.skeletonAvatarRow}>
              <View style={styles.skeletonAvatar} />
              <View style={styles.skeletonHeaderCopy}>
                <View style={styles.skeletonTitle} />
                <View style={styles.skeletonSub} />
              </View>
            </View>
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLine} />
            <View style={styles.skeletonLineShort} />
          </View>
        </View>
        <ActivityIndicator style={styles.loader} color="#6C4DD9" size="large" />
      </View>
    );
  }

  const goBack = () => {
    // If an explicit returnTo is provided, always use it (highest priority).
    // Only fall back to /pages when returnTo is explicitly /pages,
    // or there's no returnTo at all and source is "pages".
    if (returnTo && returnTo !== "/pages") {
      router.replace(returnTo as any);
      return;
    }

    if (returnTo === "/pages" || source === "pages") {
      router.replace({
        pathname: "/pages",
        params: {
          title: typeof title === "string" && title.trim() ? title : "Pages",
        },
      } as never);
      return;
    }

    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(
        source === "home"
          ? "/"
          : source === "activity"
            ? "/activity"
            : "/library",
      );
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: note.title || "Page Preview",
        message: `Check out this study note: "${note.title || "Note"}" on DigiLearn!`,
        url: note.document || note.preview,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenPdf = () => {
    if (!note.document) {
      Alert.alert("Notice", "No PDF document link is available for this note.");
      return;
    }
    router.push({
      pathname: "/pdf-reader",
      params: { uri: note.document, title: note.title ?? "PDF" },
    } as any);
  };

  const pagePreviewRoute = `/page-preview?id=${encodeURIComponent(id)}`;

  const subjectsList = normalizeArray(note.subject);

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
            { paddingBottom: 120, paddingHorizontal: horizontalPadding },
          ]}
        >
          {/* Hero Section */}
          <PageHero note={note} dateText={dateFormatted} onBack={goBack} />

          {/* White Information Sheet */}
          <Animated.View
            entering={FadeInUp.duration(430)}
            style={[styles.sheet, { paddingHorizontal: 24 }]}
          >
            {/* Header with Avatar & Page Information */}
            <SubjectBadge
              avatarUrl={subjectAvatar}
              title={note.title || "Untitled Note"}
              dateText={dateFormatted}
              subjects={subjectsList}
              pagesCount={note.pages}
              isRecommended={note.isRecommended}
              isRecentlyUpdated={isRecentlyUpdated}
              accentColor={subjectAccent}
            />

            {/* Overview Section */}
            <OverviewSection description={note.description} />

            {/* Source Section (Hidden if empty) */}
            <SourceBooks
              books={sourceBooks}
              onSelectBook={(bookId) =>
                router.push({
                  pathname: "/book-preview",
                  params: {
                    id: bookId,
                    source: source ?? "library",
                    returnTo:
                      returnTo ?? (source === "pages" ? "/pages" : "/library"),
                  },
                } as any)
              }
            />

            {/* Similar Pages Section (Hidden if empty) */}
            <SimilarPages
              pages={similarPages}
              accentColor={subjectAccent}
              onSelectPage={(nextId) =>
                router.replace({
                  pathname: "/page-preview",
                  params: { id: nextId, source: source ?? "library" },
                } as any)
              }
              onSeeAll={() => {
                if (source === "home") {
                  router.push("/library");
                }
              }}
            />
          </Animated.View>
        </ScrollView>
      </View>

      {/* Fixed Bottom Action Bar */}
      <View style={styles.actionContainer}>
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
            bookmarked={bookmarked}
            onBookmark={async () => {
              const userId = auth.currentUser?.uid;
              if (!userId) {
                setShowGuestSaveAlert(true);
                return;
              }

              try {
                await toggleSavedItem(userId, "saved-pages", id, bookmarked);
                setBookmarked((value) => !value);
              } catch (error) {
                console.error("Failed to toggle page bookmark", error);
              }
            }}
            onOpen={handleOpenPdf}
            onShare={handleShare}
            accentColor={subjectAccent}
          />
        </View>
      </View>

      <ActionDialog
        visible={showGuestSaveAlert}
        title="Save this resource"
        message="Log in or sign up to save pages and resources for later."
        primaryText="Log in"
        secondaryText="Sign up"
        onPrimary={() =>
          router.push({
            pathname: "/login",
            params: { from: pagePreviewRoute },
          } as any)
        }
        onSecondary={() =>
          router.push({
            pathname: "/signup",
            params: { from: pagePreviewRoute },
          } as any)
        }
        onClose={() => setShowGuestSaveAlert(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
  },
  contentContainer: {
    flex: 1,
    width: "100%",
  },
  sheet: {
    marginTop: -30,
    paddingTop: 25,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#FFFFFF",
    minHeight: 520,
    width: "100%",
  },
  actionContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  actionContent: {
    width: "100%",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  skeletonHero: {
    height: "45%",
    backgroundColor: "#E2E8F0",
  },
  skeletonSheet: {
    flex: 1,
    marginTop: -30,
    padding: 24,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    backgroundColor: "#FFFFFF",
  },
  skeletonAvatarRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  skeletonAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#CBD5E1",
    marginRight: 18,
  },
  skeletonHeaderCopy: {
    flex: 1,
  },
  skeletonTitle: {
    width: "70%",
    height: 22,
    borderRadius: 6,
    backgroundColor: "#CBD5E1",
    marginBottom: 10,
  },
  skeletonSub: {
    width: "40%",
    height: 14,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  skeletonLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: "#F1F5F9",
    marginBottom: 12,
  },
  skeletonLineShort: {
    width: "60%",
    height: 14,
    borderRadius: 7,
    backgroundColor: "#F1F5F9",
  },
  loader: {
    position: "absolute",
    top: "50%",
    alignSelf: "center",
  },
});
