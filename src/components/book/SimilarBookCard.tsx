import { Image } from "expo-image";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import { Book, getFallbackCover } from "./bookTypes";

export function SimilarBookCard({
  book,
  onPress,
  index,
}: {
  book: Book;
  onPress: () => void;
  index: number;
}) {
  const { colors, isDark } = useTheme();

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
          placeholder={getFallbackCover(isDark)}
          style={[styles.cover, { backgroundColor: colors.lightBackground }]}
          contentFit="cover"
          transition={180}
        />
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
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
  },
  title: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    marginTop: 8,
  },
});
