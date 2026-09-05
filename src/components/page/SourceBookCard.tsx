import { Image } from "expo-image";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTheme } from "../../contexts/ThemeContext";
import { getFallbackCover } from "../book/bookTypes";
import { SourceBook } from "./pageTypes";

export function SourceBookCard({
  book,
  onPress,
  index,
}: {
  book: SourceBook;
  onPress: () => void;
  index: number;
}) {
  const { isDark } = useTheme();

  return (
    <Animated.View entering={FadeIn.delay(index * 70).duration(300)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open book ${book.title}`}
        onPress={onPress}
        style={styles.card}
      >
        <Image
          source={book.cover}
          placeholder={getFallbackCover(isDark)}
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
  card: {
    width: 70,
    marginRight: 14,
  },
  cover: {
    width: 70,
    height: 104,
    borderRadius: 10,
    backgroundColor: "#E9EDF0",
    shadowColor: "#0F172A",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  title: {
    color: "#344054",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    marginTop: 8,
  },
});
