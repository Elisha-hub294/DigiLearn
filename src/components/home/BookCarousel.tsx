import { Image } from "expo-image";
import { router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { db } from "../../../firebaseConfig";
import { colors, radius, spacing } from "../../constants/theme";

type BookItem = {
  id: string;
  title: string;
  author: string;
  rating: string;
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

const formatRating = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `${value.toFixed(1)}`;
  }

  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (!Number.isNaN(parsed)) {
      return `${parsed.toFixed(1)}`;
    }
  }

  return "4.8";
};

export const BookCarousel = () => {
  const { width } = useWindowDimensions();
  const [books, setBooks] = useState<BookItem[]>([]);
  const [loading, setLoading] = useState(true);
  const cardWidth = width >= 900 ? 220 : 180;

  useEffect(() => {
    let isMounted = true;

    const fetchBooks = async () => {
      try {
        const snapshot = await getDocs(collection(db, "books"));

        if (!isMounted) {
          return;
        }

        const fetchedBooks = snapshot.docs
          .map((doc, index) => {
            const data = doc.data() as Record<string, any>;
            const ratingValue = Number.parseFloat(
              data.rating || data.averageRating || data.score || "4.8",
            );

            return {
              id: doc.id || `book-${index}`,
              title: pickString(
                data.title || data.name || data.bookTitle,
                "Untitled book",
              ),
              author: pickString(
                data.author || data.writer || data.publisher,
                "Unknown author",
              ),
              rating: formatRating(ratingValue),
              image: pickImage(
                data.image || data.coverImage || data.cover || data.thumbnail,
                require("../../../assets/images/lib.jpeg"),
              ),
            } satisfies BookItem;
          })
          .sort(
            (a, b) => Number.parseFloat(b.rating) - Number.parseFloat(a.rating),
          );

        setBooks(fetchedBooks);
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

  if (loading) {
    return (
      <Animated.View entering={FadeInUp.duration(680)} style={styles.container}>
        <Text style={styles.loadingText}>Loading textbooks...</Text>
      </Animated.View>
    );
  }

  if (books.length === 0) {
    return (
      <Animated.View entering={FadeInUp.duration(680)} style={styles.container}>
        <Text style={styles.loadingText}>No textbooks available yet.</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(680)} style={styles.container}>
      <FlatList
        horizontal
        data={books}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card, { width: cardWidth }]}
            accessibilityRole="button"
            accessibilityLabel={`Open ${item.title}`}
            onPress={() =>
              router.push({
                pathname: "/book-preview",
                params: { id: item.id, source: "home" },
              } as any)
            }
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Open teacher profile: ${item.author}`}
              onPress={(event) => {
                event.stopPropagation?.();
                router.push({
                  pathname: "/teacher-profile",
                  params: { name: item.author },
                } as never);
              }}
            >
              <Image
                source={item.image}
                style={styles.image}
                contentFit="cover"
              />
            </Pressable>
            <View style={styles.body}>
              <Text style={styles.title}>{item.title}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Open teacher profile: ${item.author}`}
                onPress={() =>
                  router.push({
                    pathname: "/teacher-profile",
                    params: { name: item.author },
                  } as never)
                }
              >
                <Text style={styles.author}>{item.author}</Text>
              </Pressable>
              <View style={styles.row}>
                <Text style={styles.rating}>★ {item.rating}</Text>
                <View style={styles.buttonWrap}>
                  <Text style={styles.buttonText}>Open Library</Text>
                </View>
              </View>
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
  list: { paddingRight: spacing.md, paddingVertical: spacing.lg },
  card: {
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  image: { width: "100%", height: 170 },
  body: { padding: spacing.md },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  author: { color: colors.subtitle, fontSize: 12, marginBottom: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: { color: colors.text, fontSize: 12, fontWeight: "700" },
  buttonWrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "#EFF6FF",
  },
  buttonText: { color: colors.primary, fontSize: 10, fontWeight: "700" },
});
