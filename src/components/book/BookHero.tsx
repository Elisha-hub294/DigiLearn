import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { FavoriteButton } from "./FavoriteButton";
import { Book } from "./bookTypes";

export function BookHero({
  book,
  favourite,
  onFavourite,
  onBack,
}: {
  book: Book;
  favourite: boolean;
  onFavourite: () => void;
  onBack: () => void;
}) {
  const { height } = useWindowDimensions();
  const heroHeight = Math.min(Math.max(height * 0.46, 330), 520);
  const hasCover = Boolean(book.cover && book.cover.trim());

  return (
    <Animated.View
      entering={FadeIn.duration(450)}
      style={[styles.hero, { height: heroHeight }]}
    >
      {/* Fallback background block in case cover is empty/loading */}
      <View style={styles.fallbackBackground} />

      {hasCover && (
        <Image
          source={{ uri: book.cover }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={250}
        />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,.05)", "rgba(0,0,0,.2)", "rgba(0,0,0,.75)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.nav}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.back}
        >
          <Feather name="chevron-left" color="#fff" size={27} />
        </Pressable>
        <FavoriteButton selected={favourite} onPress={onFavourite} />
      </View>

      <Animated.View
        entering={FadeInUp.duration(480).delay(100)}
        style={styles.copy}
      >
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text style={styles.meta}>
          {[book.year, book.edition].filter(Boolean).join(" • ") || "Book"}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", overflow: "hidden", backgroundColor: "#1D2B36" },
  fallbackBackground: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#223340",
  },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,.28)",
  },
  copy: { position: "absolute", bottom: 42, left: 24, right: 24 },
  title: {
    maxWidth: "78%",
    color: "#fff",
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  meta: {
    color: "rgba(255,255,255,.84)",
    fontSize: 15,
    marginTop: 9,
    fontWeight: "600",
  },
});
