import { FirebaseImage as Image } from "@/components/ui/FirebaseImage";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { getThemeAsset } from "../../constants/themeAssets";
import { useTheme } from "../../contexts/ThemeContext";
import { Book } from "./bookTypes";

export function BookHero({ book, onBack }: { book: Book; onBack: () => void }) {
  const { colors, isDark } = useTheme();
  const fallbackCover = getThemeAsset("bookCoverDefault", isDark);
  const { width, height } = useWindowDimensions();
  const heroHeight = Math.min(Math.max(height * 0.48, 360), 500);
  const hasCover = Boolean(book.cover && book.cover.trim());
  const [imageSize, setImageSize] = useState<{
    width: number;
    height: number;
  }>();
  const aspectRatio = imageSize ? imageSize.width / imageSize.height : 0;
  const resolvedAspectRatio = aspectRatio || 156 / 214;
  const availableCoverWidth = Math.max(120, width - 48);
  const availableCoverHeight = Math.max(140, heroHeight - 158);
  const maxCoverWidth =
    aspectRatio > 1.15
      ? availableCoverWidth * 0.92
      : aspectRatio >= 0.85
        ? availableCoverWidth * 0.68
        : availableCoverWidth * 0.56;
  const coverWidth = Math.min(
    maxCoverWidth,
    availableCoverHeight * resolvedAspectRatio,
  );
  const coverDimensions = {
    width: coverWidth,
    height: coverWidth / resolvedAspectRatio,
  };

  return (
    <Animated.View
      entering={FadeIn.duration(450)}
      style={[styles.hero, { height: heroHeight }]}
    >
      <LinearGradient
        colors={["#E7F0F6", "#F7FAFC"]}
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
      </View>

      <Animated.View
        entering={FadeInUp.duration(480).delay(100)}
        style={styles.copy}
      >
        <View style={[styles.coverFrame, coverDimensions]}>
          <Image
            source={hasCover ? { uri: book.cover } : fallbackCover}
            style={styles.cover}
            contentFit="contain"
            transition={250}
            onLoad={(event) => {
              const { width: loadedWidth, height: loadedHeight } = event.source;
              if (loadedWidth > 0 && loadedHeight > 0) {
                setImageSize({ width: loadedWidth, height: loadedHeight });
              }
            }}
          />
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {book.title}
        </Text>
        <Text
          style={[styles.meta, { color: colors.subtitle }]}
          numberOfLines={1}
        >
          {book.author.join(", ") || "Unknown author"}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: { width: "100%", overflow: "hidden", backgroundColor: "#E7F0F6" },
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
  copy: {
    position: "absolute",
    bottom: 28,
    left: 24,
    right: 24,
    alignItems: "center",
  },
  coverFrame: {
    marginBottom: 18,
    borderRadius: 8,
    backgroundColor: "#D8E3EA",
    boxShadow: "0px 8px 14px rgba(23, 43, 58, 0.18)",
    elevation: 7,
    overflow: "hidden",
  },
  cover: { width: "100%", height: "100%" },
  title: {
    maxWidth: "94%",
    color: "#172B3A",
    fontSize: 25,
    lineHeight: 31,
    fontWeight: "800",
    textAlign: "center",
    textTransform: "capitalize",
  },
  meta: {
    color: "#5B7180",
    fontSize: 15,
    marginTop: 9,
    fontWeight: "600",
    textAlign: "center",
  },
});
