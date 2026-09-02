import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { db } from "../../../firebaseConfig";
import { FeaturedNoteCard } from "../../components/home/FeaturedNoteCard";
import {
  TeacherPostCard,
  normalizeTeacherPost,
} from "../../components/home/TeacherPostCard";
import { BookCard } from "../../components/library/BookCard";
import { PaperCard } from "../../components/library/PaperCard";
import {
  TrendingVideoCard,
  VideoLesson,
} from "../../components/ui/TrendingVideoCard";
import { colors, radius, spacing } from "../../constants/theme";
import type { UserProfile } from "../../services/userProfile";
type Filter = "All" | "Pages" | "Books" | "Papers" | "Lessons" | "Posts";
type Entry = {
  id: string;
  type: Exclude<Filter, "All">;
  data: Record<string, any>;
  savedAt?: unknown;
};
const filters: Filter[] = [
  "All",
  "Pages",
  "Books",
  "Papers",
  "Lessons",
  "Posts",
];
const details: Record<Exclude<Filter, "All">, [string, string]> = {
  Pages: ["No saved notes yet.", "Save useful notes to find them here."],
  Books: ["No saved books yet.", "Save books you want to revisit."],
  Papers: ["No saved papers yet.", "Save past papers to practise later."],
  Lessons: ["No saved lessons yet.", "Save lessons to watch later."],
  Posts: ["No saved posts yet.", "Save helpful teacher posts for later."],
};
const field: Record<Exclude<Filter, "All">, [keyof UserProfile, string]> = {
  Pages: ["saved-pages", "pages"],
  Books: ["saved-books", "books"],
  Papers: ["saved-papers", "pastPaper"],
  Lessons: ["saved-lessons", "trendingLessons"],
  Posts: ["saved-posts", "teacherPosts"],
};
const savedAtValue = (value: unknown) => {
  if (
    value &&
    typeof (value as { toMillis?: () => number }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }
  if (value instanceof Date) return value.getTime();
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};
export function SavedResources({
  profile,
  signedIn,
}: {
  profile: UserProfile | null;
  signedIn: boolean;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("All");
  const [items, setItems] = useState<Entry[]>([]);
  const [resultsWidth, setResultsWidth] = useState(0);
  const [loading, setLoading] = useState(Boolean(profile));
  const key =
    JSON.stringify(profile?.["saved-pages"] ?? []) +
    JSON.stringify(profile?.["saved-books"] ?? []) +
    JSON.stringify(profile?.["saved-papers"] ?? []) +
    JSON.stringify(profile?.["saved-lessons"] ?? []) +
    JSON.stringify(profile?.["saved-posts"] ?? []);
  useEffect(() => {
    let active = true;
    if (!profile) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(
      (Object.keys(field) as Exclude<Filter, "All">[]).map(async (type) => {
        const [profileKey, collectionName] = field[type];
        const ids = Array.isArray(profile[profileKey])
          ? (profile[profileKey] as string[])
          : [];
        const loaded = await Promise.all(
          ids.map(async (id) => {
            try {
              const snap = await getDoc(doc(db, collectionName, id));
              return snap.exists()
                ? ({
                    id: snap.id,
                    type,
                    data: snap.data(),
                    savedAt: profile.savedAt?.[`${profileKey}:${id}`],
                  } as Entry)
                : null;
            } catch {
              return null;
            }
          }),
        );
        return loaded.filter(Boolean) as Entry[];
      }),
    )
      .then((groups) => {
        if (active) {
          const flattened = groups.flat();
          setItems(
            flattened
              .map((item, index) => ({ item, index }))
              .sort(
                (left, right) =>
                  savedAtValue(right.item.savedAt) -
                    savedAtValue(left.item.savedAt) || left.index - right.index,
              )
              .map(({ item }) => item),
          );
        }
      })
      .catch(() => active && setItems([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [key, profile]);
  const displayed = useMemo(
    () =>
      filter === "All" ? items : items.filter((item) => item.type === filter),
    [items, filter],
  );
  if (!signedIn)
    return (
      <View style={s.card}>
        <View style={s.empty}>
          <Text style={s.emptyTitle}>
            Sign in to keep your learning organized
          </Text>
          <Text style={s.emptyCopy}>
            Log in or create a DigiLearn account to save books, lessons, notes,
            and posts and keep your learning progress with you.
          </Text>
          <View style={s.authActions}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/login",
                  params: { from: "/profile" },
                })
              }
              style={s.loginButton}
              accessibilityRole="button"
            >
              <Text style={s.loginText}>Log in</Text>
            </Pressable>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/signup",
                  params: { from: "/profile" },
                })
              }
              style={s.signupButton}
              accessibilityRole="button"
            >
              <Text style={s.signupText}>Sign up</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  return (
    <View style={s.card}>
      <Text style={s.title}>Saved</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
      >
        {filters.map((choice) => (
          <Pressable
            key={choice}
            onPress={() => setFilter(choice)}
            accessibilityRole="button"
            accessibilityLabel={`Show saved ${choice.toLowerCase()}`}
            accessibilityState={{ selected: filter === choice }}
            style={[s.chip, filter === choice && s.chipActive]}
          >
            <Text style={[s.chipText, filter === choice && s.chipTextActive]}>
              {choice}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {loading ? (
        <View style={s.loading}>
          <ActivityIndicator color={colors.primary} />
          <View style={s.skeleton} />
          <View style={s.skeleton} />
        </View>
      ) : displayed.length ? (
        <Animated.View
          entering={FadeIn.duration(180)}
          onLayout={(event) => setResultsWidth(event.nativeEvent.layout.width)}
          style={s.results}
        >
          {resultsWidth > 0
            ? renderItems(
                displayed,
                router,
                (resultsWidth - spacing.lg * 2) * 0.8,
                resultsWidth,
              )
            : null}
        </Animated.View>
      ) : (
        <Empty filter={filter} />
      )}
    </View>
  );
}
function Empty({ filter }: { filter: Filter }) {
  const [title, copy] = details[filter === "All" ? "Pages" : filter];
  return (
    <View style={s.empty}>
      <Text style={s.emptyTitle}>
        {filter === "All" ? "Nothing saved yet." : title}
      </Text>
      <Text style={s.emptyCopy}>
        {filter === "All"
          ? "Save books, lessons, notes, and posts to keep them handy."
          : copy}
      </Text>
    </View>
  );
}
function renderItems(
  items: Entry[],
  router: any,
  itemWidth: number,
  resultsWidth: number,
) {
  const pages = items.filter((x) => x.type === "Pages");
  return (
    <>
      {pages.length ? (
        <FeaturedNoteCard
          notes={pages.map((x) => ({ id: x.id, ...x.data }))}
          source="pages"
        />
      ) : null}
      {items
        .filter((x) => x.type === "Books")
        .map((x) => (
          <View key={x.id} style={s.centeredItem}>
            <BookCard
              width={itemWidth}
              marginRight={0}
              item={{
                id: x.id,
                title: x.data.title ?? "Untitled book",
                author: x.data.author ?? "Unknown author",
                description: x.data.description ?? "",
                image:
                  x.data.image ??
                  x.data.cover ??
                  require("../../../assets/images/bookcover-default.png"),
              }}
              onPress={() =>
                router.push({
                  pathname: "/book-preview",
                  params: { id: x.id, source: "saved", returnTo: "/profile" },
                })
              }
            />
          </View>
        ))}
      {items
        .filter((x) => x.type === "Lessons")
        .map((x) => (
          <View key={x.id} style={[s.centeredItem, s.videoItem]}>
            <TrendingVideoCard
              width={itemWidth}
              marginRight={0}
              item={
                {
                  id: x.id,
                  title: x.data.title ?? "Untitled lesson",
                  teacher: x.data.teacher ?? "DigiLearn",
                  subject: x.data.subject ?? "",
                  uploadedAt: x.data.uploadedAt ?? "",
                  duration: x.data.duration ?? "",
                  thumbnail: x.data.thumbnail,
                  avatar: x.data.avatar,
                  link: x.data.link,
                } as VideoLesson
              }
            />
          </View>
        ))}
      {items.filter((x) => x.type === "Posts").length ? (
        <TeacherPostCard
          posts={items
            .filter((x) => x.type === "Posts")
            .map((x) => normalizeTeacherPost({ id: x.id, data: () => x.data }))}
        />
      ) : null}
      {items
        .filter((x) => x.type === "Papers")
        .map((x) => (
          <View key={x.id} style={s.centeredItem}>
            <PaperCard
              id={x.id}
              title={x.data.title ?? x.data.name ?? "Untitled past paper"}
              width={(resultsWidth - spacing.lg * 2) * 0.6}
              subject={x.data.subject ?? x.data.topic}
              year={x.data.year ?? x.data.examYear}
              description={x.data.description ?? x.data.summary}
              level={x.data.level ?? x.data.examLevel}
              pageNumber={x.data.pageNumber ?? x.data.pages}
              paperCode={x.data.paperCode ?? x.data.code}
              paperNumber={x.data.paperNumber ?? x.data.number}
              image={x.data.cover ?? x.data.image ?? x.data.thumbnail}
              document={
                x.data.doc ?? x.data.document ?? x.data.pdf ?? x.data.url
              }
            />
          </View>
        ))}
    </>
  );
}
const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    paddingVertical: spacing.lg,
    overflow: "hidden",
  },
  title: {
    paddingHorizontal: spacing.lg,
    fontSize: 19,
    fontWeight: "700",
    color: "#171717",
    marginBottom: 12,
  },
  chips: { paddingHorizontal: spacing.lg, gap: 8, paddingBottom: 14 },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    justifyContent: "center",
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "#D8E2F3",
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: "#52709B", fontSize: 13, fontWeight: "700" },
  chipTextActive: { color: "#fff" },
  results: { paddingHorizontal: spacing.lg },
  centeredItem: { width: "100%", alignItems: "center" },
  videoItem: { marginBottom: spacing.md },
  loading: { paddingHorizontal: spacing.lg, gap: 10 },
  skeleton: { height: 96, borderRadius: 14, backgroundColor: "#EEF2F7" },
  empty: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  emptyCopy: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  authActions: { flexDirection: "row", gap: 10, marginTop: 8 },
  loginButton: {
    minHeight: 40,
    minWidth: 86,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  loginText: { color: colors.primary, fontWeight: "700" },
  signupButton: {
    minHeight: 40,
    minWidth: 86,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
    backgroundColor: colors.primary,
  },
  signupText: { color: "#fff", fontWeight: "700" },
});
