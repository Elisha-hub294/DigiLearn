import { Image } from "expo-image";
import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
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
import { auth, db } from "../../../firebaseConfig";
import { colors, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import { recordUserActivity } from "../../services/activityService";
import { SectionHeader } from "../ui/SectionHeader";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../../utils/interestFilter";

type BookItem = {
  id: string;
  title: string;
  author: string;
  subject?: string;
  image: any;
};

const pickString = (value: unknown, fallback = "") => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }
  return fallback;
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
        const snapshot = await getDocs(collection(db, "books"));

        if (!isMounted) {
          return;
        }

        const fetchedBooks = snapshot.docs.map((doc, index) => {
          const data = doc.data() as Record<string, any>;

          return {
            id: doc.id || `book-${index}`,
            title: pickString(
              data.title || data.name || data.bookTitle,
              "Untitled book",
            ),
            author: (() => {
              const rawAuthor = data.author || data.writer || data.publisher;
              if (Array.isArray(rawAuthor) && rawAuthor.length > 0) {
                return String(rawAuthor[0]);
              }
              return pickString(rawAuthor, "");
            })(),
            subject: pickString(
              data.subject || data.category || data.title,
              "",
            ),
            image: pickImage(
              data.image || data.coverImage || data.cover || data.thumbnail,
              require("../../../assets/images/bookcover-default.jpeg"),
            ),
          } satisfies BookItem;
        });

        // Shuffle fetched books to randomize order
        const shuffled = [...fetchedBooks];
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
        <Text style={styles.loadingText}>Loading textbooks...</Text>
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
        onSeeAll={() => router.push("/library")}
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
  loadingText: {
    color: colors.subtitle,
    fontSize: 13,
    paddingVertical: spacing.sm,
  },
  list: { paddingRight: spacing.md },
  card: {
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 5,
    overflow: "hidden",
  },
  image: { width: "100%", height: 200 },
  body: { paddingVertical: spacing.xs },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  author: { color: colors.subtitle, fontSize: 12, marginBottom: spacing.sm },
});
