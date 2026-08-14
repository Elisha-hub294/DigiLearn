import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { books, type BookItem } from "../constants/homeData";
import { colors, radius, shadows, spacing } from "../constants/theme";

export const TextBookCarousel = () => {
  const data = [...books, ...books];

  return (
    <Animated.View entering={FadeInUp.duration(560)}>
      <FlatList
        horizontal
        data={data}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => <BookCard item={item} />}
        contentContainerStyle={styles.list}
      />
    </Animated.View>
  );
};

const BookCard = ({ item }: { item: BookItem }) => {
  const router = useRouter();

  const handlePress = () => {
    router.push({
      pathname: "/book-preview",
      params: { id: item.id },
    });
  };

  return (
    <Pressable
      style={styles.card}
      accessibilityRole="button"
      onPress={handlePress}
    >
      <Image source={item.image} style={styles.image} contentFit="cover" />
      <View style={styles.body}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.author}>{item.author}</Text>
        <View style={styles.row}>
          <Text style={styles.rating}>★ {item.rating}</Text>
          <View style={[styles.badge, { backgroundColor: item.accent }]}>
            <Text style={styles.badgeText}>Open Library</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  list: { paddingRight: spacing.md },
  card: {
    width: 180,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 22,
    overflow: "hidden",
    ...shadows.card,
  },
  image: { width: "100%", height: 170 },
  body: { padding: spacing.md },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  author: { color: colors.subtitle, fontSize: 12, marginBottom: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: { color: colors.text, fontSize: 12, fontWeight: "700" },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.white, fontSize: 10, fontWeight: "700" },
});
