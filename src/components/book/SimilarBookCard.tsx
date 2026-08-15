import { Image } from "expo-image";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Book, FALLBACK_COVER } from "./bookTypes";

export function SimilarBookCard({
  book,
  onPress,
  index,
}: {
  book: Book;
  onPress: () => void;
  index: number;
}) {
  return (
    <Animated.View entering={FadeIn.delay(index * 70).duration(300)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open ${book.title}`}
        onPress={onPress}
        style={styles.card}
      >
        <Image
          source={book.cover}
          placeholder={FALLBACK_COVER}
          style={styles.cover}
          contentFit="cover"
          transition={180}
        />
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  card: { width: 80, marginRight: 14 },
  cover: {
    width: 80,
    height: 110,
    borderRadius: 5,
    backgroundColor: "#E9EDF0",
  },
  title: {
    color: "#344054",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    marginTop: 8,
  },
});
