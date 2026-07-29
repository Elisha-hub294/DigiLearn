import { Image } from "expo-image";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";

type TopSellingBook = {
  id: string;
  title: string;
  author: string;
  rating: string;
  avatar: any;
  image: any;
  badge?: string;
};

type TopSellingBooksProps = {
  items: TopSellingBook[];
};

export function TopSellingBooks({ items }: TopSellingBooksProps) {
  const uniqueItems = React.useMemo(() => {
    const seen = new Set<string>();

    return items.filter((book) => {
      if (seen.has(book.id)) {
        return false;
      }

      seen.add(book.id);
      return true;
    });
  }, [items]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {uniqueItems.map((book) => (
        <View key={book.id} style={styles.card}>
          <Image source={book.image} style={styles.cover} contentFit="cover" />
          {book.badge ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{book.badge}</Text>
            </View>
          ) : null}
          <View style={styles.info}>
            <Text style={styles.title} numberOfLines={2}>
              {book.title}
            </Text>
            <Text style={styles.author}>{book.author}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.rating}>{book.rating}</Text>
              <Image
                source={book.avatar}
                style={styles.avatar}
                contentFit="cover"
              />
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingRight: spacing.lg,
    paddingBottom: spacing.sm,
  },
  card: {
    width: 250,
    marginRight: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  cover: {
    width: "100%",
    height: 220,
  },
  badge: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: "rgba(0,0,0,0.65)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  info: {
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  author: {
    color: colors.subtitle,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: {
    color: "#FFB400",
    fontSize: 12,
    fontWeight: "700",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
});
