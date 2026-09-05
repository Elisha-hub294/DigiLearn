import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
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
              <Feather name="file-text" size={20} color="#FFFFFF" />
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
    shadowColor: "#0F172A",
    shadowOpacity: 0.12,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  previewFallback: {
    backgroundColor: "#64748B",
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
