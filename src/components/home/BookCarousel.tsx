import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { auth } from "../../../firebaseConfig";
import { spacing } from "../../constants/theme";
import { getThemeAsset } from "../../constants/themeAssets";
import { useProfile } from "../../contexts/ProfileContext";
import { useTheme } from "../../contexts/ThemeContext";
import { recordUserActivity } from "../../services/activityService";
import { loadBooks } from "../../services/booksService";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../../utils/interestFilter";
import { ResourceDeleteMenu } from "../ui/ResourceDeleteMenu";
import { SectionHeader } from "../ui/SectionHeader";
import { Skeleton } from "../ui/Skeleton";

type BookItem = {
  id: string;
  title: string;
  author: string;
  subject?: string;
  image: any;
  owner?: string;
};

const pickImage = (value: unknown, fallback: any) => {
  if (typeof value === "string" && value.trim()) {
    return value;
  }
  return fallback;
};

export const BookCarousel = () => {
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const { colors: themeColors, isDark } = useTheme();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [coverRatios, setCoverRatios] = useState<Record<string, number>>({});
  const maxCardWidth = Math.min(320, Math.max(190, width - 40));
  const defaultCardWidth = Math.min(maxCardWidth, 220);

  useEffect(() => {
    let isMounted = true;

    const fetchBooks = async () => {
      try {
        const fetchedBooks = await loadBooks();

        if (!isMounted) {
          return;
        }

        const normalizedBooks = fetchedBooks.map((book) => ({
          ...book,
          image: pickImage(
            book.image,
            getThemeAsset("bookCoverDefault", isDark),
          ),
        })) satisfies BookItem[];

        // Shuffle fetched books to randomize order
        const shuffled = [...normalizedBooks];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        setBooks(shuffled);
      } catch (error) {
        console.error("Failed to load textbooks", error);
        if (isMounted) {
          setBooks([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchBooks();

    return () => {
      isMounted = false;
    };
  }, [isDark]);

  const displayedBooks = useMemo(() => {
    if (!shouldFilterByInterests(profile)) return books;
    return books.filter((book) =>
      matchesUserInterests(book.subject || book.title, profile?.subjects),
    );
  }, [books, profile]);

  if (loading) {
    return (
      <Animated.View entering={FadeInUp.duration(680)} style={styles.container}>
        <SectionHeader title="Books" />
        <FlatList
          horizontal
          data={[0, 1, 2]}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => `book-skeleton-${item}`}
          renderItem={() => (
            <View
              style={[
                styles.card,
                {
                  backgroundColor: themeColors.surface,
                  width: defaultCardWidth,
                },
              ]}
            >
              <Skeleton style={[styles.image, { height: 300 }]} />
              <View style={styles.body}>
                <Skeleton style={styles.titleSkeleton} />
                <Skeleton style={styles.authorSkeleton} />
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
          accessibilityLabel="Loading books"
        />
      </Animated.View>
    );
  }

  if (displayedBooks.length === 0) {
    return null;
  }

  return (
    <Animated.View entering={FadeInUp.duration(680)} style={styles.container}>
      <SectionHeader
        title="Books"
        onSeeAll={() => router.push("/see-all?type=books")}
      />
      <FlatList
        horizontal
        data={displayedBooks}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const coverRatio = coverRatios[item.id] ?? 0.72;
          const isLandscape = coverRatio >= 1;
          const imageHeight = isLandscape ? 180 : 300;
          const cardWidth = Math.min(
            maxCardWidth,
            Math.max(160, imageHeight * coverRatio),
          );

          return (
            <View
              style={[
                styles.card,
                { backgroundColor: themeColors.surface, width: cardWidth },
              ]}
            >
              <Pressable
                style={styles.cardAction}
                accessibilityRole="button"
                accessibilityLabel={`Open ${item.title}`}
                onPress={() => {
                  if (auth.currentUser?.uid) {
                    recordUserActivity(auth.currentUser.uid, "book", item.id);
                  }
                  router.push({
                    pathname: "/book-preview",
                    params: { id: item.id, source: "home", returnTo: "/" },
                  } as any);
                }}
              />
              <View style={styles.menu}>
                <ResourceDeleteMenu
                  collection="books"
                  id={item.id}
                  title={item.title}
                  data={{ owner: item.owner, cover: item.image }}
                  onDeleted={() =>
                    setBooks((current) =>
                      current.filter((book) => book.id !== item.id),
                    )
                  }
                  light
                />
              </View>
              <Image
                source={item.image}
                style={[styles.image, { height: imageHeight }]}
                contentFit="contain"
                onLoad={(event) => {
                  const { width: imageWidth, height: imageHeight } =
                    event.source;
                  const nextRatio = imageWidth / imageHeight;
                  setCoverRatios((current) =>
                    current[item.id] === nextRatio
                      ? current
                      : { ...current, [item.id]: nextRatio },
                  );
                }}
              />
              <View style={styles.body}>
                <Text style={[styles.title, { color: themeColors.text }]}>
                  {item.title}
                </Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Open teacher profile: ${item.author}`}
                  onPress={() => {
                    router.push({
                      pathname: "/teacher-profile",
                      params: { name: item.author },
                    } as never);
                  }}
                >
                  <Text
                    style={[styles.author, { color: themeColors.subtitle }]}
                  >
                    {item.author}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        }}
        contentContainerStyle={styles.list}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.sm },
  list: { paddingRight: spacing.md },
  card: {
    marginRight: spacing.md,
    borderRadius: 5,
    overflow: "hidden",
    position: "relative",
  },
  cardAction: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
  },
  menu: { position: "absolute", top: 6, right: 6, zIndex: 2 },
  image: { width: "100%" },
  body: { padding: spacing.sm, minHeight: 72 },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  titleSkeleton: { width: "78%", height: 14, marginBottom: 8 },
  authorSkeleton: { width: "46%", height: 12 },
  author: { fontSize: 12, marginBottom: spacing.sm },
});
