import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { FALLBACK_DOC_PREVIEW, TopicalNote } from "./pageTypes";

export function SimilarPageCard({
  page,
  onPress,
  index,
}: {
  page: TopicalNote;
  onPress: () => void;
  index: number;
}) {
  const previewUri = page.preview || FALLBACK_DOC_PREVIEW;

  return (
    <Animated.View entering={FadeIn.delay(index * 70).duration(300)}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open similar page ${page.title || "Note"}`}
        onPress={onPress}
        style={styles.card}
      >
        <View style={styles.previewWrap}>
          <Image
            source={{ uri: previewUri }}
            placeholder={{ uri: FALLBACK_DOC_PREVIEW }}
            style={styles.preview}
            contentFit="cover"
            transition={180}
          />
          <View style={styles.overlay} />
          <View style={styles.iconContainer}>
            <Feather name="file-text" size={20} color="#FFFFFF" />
          </View>
        </View>
        <Text style={styles.title} numberOfLines={2}>
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
    backgroundColor: "#E2E8F0",
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
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.25)",
  },
  iconContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: "#344054",
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    marginTop: 6,
  },
});
