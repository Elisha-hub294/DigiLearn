import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PdfPreview from "../home/PdfPreview";
import { TopicalNote } from "./pageTypes";

export function PageHero({
  note,
  dateText,
  onBack,
}: {
  note: TopicalNote;
  dateText: string;
  onBack: () => void;
}) {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const heroHeight = Math.min(Math.max(height * 0.5, 320), 500);
  const previewUri = note.preview;

  return (
    <Animated.View
      entering={FadeIn.duration(450)}
      style={[styles.hero, { height: heroHeight }]}
    >
      {note.document ? (
        <PdfPreview uri={note.document} style={StyleSheet.absoluteFill} />
      ) : previewUri ? (
        <Image
          source={{ uri: previewUri }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top"
          transition={250}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.previewFallback]} />
      )}

      <LinearGradient
        colors={["rgba(0,0,0,0.25)", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.82)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Floating Navigation */}
      <View style={[styles.nav, { paddingTop: Math.max(insets.top + 8, 16) }]}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={({ pressed }) => [styles.back, pressed && styles.pressed]}
          hitSlop={8}
        >
          <Feather name="chevron-left" color="#FFFFFF" size={28} />
        </Pressable>
      </View>

      {/* Page Information anchored to bottom-left corner */}
      <Animated.View
        entering={FadeInUp.duration(480).delay(100)}
        style={styles.copy}
        pointerEvents="none"
      >
        <Text style={styles.title} numberOfLines={2}>
          {note.title || "Untitled Page"}
        </Text>
        <Text style={styles.subtitle}>{dateText}</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  previewFallback: { backgroundColor: "#D1D5DB" },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    zIndex: 10,
  },
  back: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  copy: {
    position: "absolute",
    bottom: 34,
    left: 24,
    right: 24,
    zIndex: 5,
  },
  title: {
    maxWidth: "85%",
    color: "#FFFFFF",
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "600",
  },
  subtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    fontWeight: "500",
    marginTop: 8,
  },
});
