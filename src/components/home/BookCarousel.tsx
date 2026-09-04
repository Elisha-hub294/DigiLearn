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
import { colors, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
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
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const cardWidth = width >= 900 ? 300 : 250;

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
            require("../../../assets/images/bookcover-default.png"),
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
  }, []);

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
            <View style={[styles.card, { width: cardWidth }]}>
              <Skeleton style={styles.image} />
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
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { width: cardWidth }]}
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
          >
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
              style={styles.image}
              contentFit="contain"
            />
            <View style={styles.body}>
              <Text style={styles.title}>{item.title}</Text>
              <Pressable
                accessibilityLabel={`Open teacher profile: ${item.author}`}
                onPress={(event) => {
                  event.stopPropagation?.();
                  router.push({
                    pathname: "/teacher-profile",
                    params: { name: item.author },
                  } as never);
                }}
              >
                <Text style={styles.author}>{item.author}</Text>
              </Pressable>
            </View>
          </Pressable>
        )}
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
    backgroundColor: colors.white,
    borderRadius: 5,
    overflow: "hidden",
    position: "relative",
  },
  menu: { position: "absolute", top: 6, right: 6, zIndex: 2 },
  image: { width: "100%", height: 200 },
  body: { paddingVertical: spacing.xs },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  titleSkeleton: { width: "78%", height: 14, marginBottom: 8 },
  authorSkeleton: { width: "46%", height: 12 },
  author: { color: colors.subtitle, fontSize: 12, marginBottom: spacing.sm },
});
