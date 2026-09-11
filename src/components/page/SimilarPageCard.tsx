import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { colors } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";
import { TopicalNote } from "./pageTypes";

export function SimilarPageCard({
  page,
  onPress,
  index,
}: {
  page: TopicalNote;
  onPress: () => void;
  index: number;
}) {
  const { colors } = useTheme();
  const [imageFailed, setImageFailed] = useState(false);
  const previewUri = page.cover?.trim();
  const showFallback = !previewUri || imageFailed;

  return (
    <Animated.View entering={FadeIn.delay(index * 70).duration(300)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open similar page ${page.title || "Note"}`}
        onPress={onPress}
        style={styles.card}
      >
        <View style={styles.previewWrap}>
          {!showFallback ? (
            <Image
              source={{ uri: previewUri }}
              style={styles.preview}
              contentFit="cover"
              transition={180}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <View
              style={[
                styles.preview,
                styles.previewFallback,
                { backgroundColor: colors.border },
              ]}
            >
              <Feather name="file-text" size={20} color={colors.white} />
            </View>
          )}
        </View>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {page.title || "Untitled Page"}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 110,
    marginRight: 14,
  },
  previewWrap: {
    width: 110,
    height: 62,
    borderRadius: 8,
    overflow: "hidden",
    position: "relative",
    boxShadow: "0px 2px 5px rgba(15, 23, 42, 0.12)",
    elevation: 2,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  previewFallback: {
    backgroundColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    marginTop: 6,
  },
});
