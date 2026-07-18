import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, shadows, spacing } from "../../constants/theme";

export const FeaturedNoteCard = () => {
  return (
    <Animated.View entering={FadeInUp.duration(420)} style={styles.card}>
      <View style={styles.previewWrap}>
        <Image
          source={require("../../../assets/images/pdf-preview.jpeg")}
          style={styles.preview}
          contentFit="cover"
        />
        <View style={styles.overlay} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Quadratic Equations</Text>
        <Text style={styles.description}>
          A clear guide to factorization, roots, and graph interpretation with
          worked examples.
        </Text>
        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>12 Pages</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>PDF</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>Updated 3 days ago</Text>
          </View>
          <Pressable
            style={styles.downloadButton}
            accessibilityLabel="Download featured note"
          >
            <Icon name="download" size={16} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    padding: spacing.lg,
    ...shadows.card,
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  profileRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "flex-end",
  },
  avatar: { width: 42, height: 42, borderRadius: 21, marginRight: spacing.sm },
  teacher: { color: colors.text, fontSize: 13, fontWeight: "700" },
  subject: { color: colors.subtitle, fontSize: 12, marginTop: 2 },
  previewWrap: {
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.md,
  },
  preview: { width: "100%", height: 180 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.25)" },
  content: {},
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
  },
  description: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },
  meta: { color: colors.subtitle, fontSize: 11, fontWeight: "600" },
  dot: { color: colors.subtitle, marginHorizontal: 6 },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
  },
});
