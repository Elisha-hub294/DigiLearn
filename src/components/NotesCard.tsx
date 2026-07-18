import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { subjectColors } from "../constants/homeData";
import { colors, shadows, spacing } from "../constants/theme";

export const NotesCard = () => {
  const accent = subjectColors.Mathematics;

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.card}>
      <Image
        source={require("../../assets/images/pdf-preview.jpeg")}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.overlay} />
      <View style={[styles.badge, { backgroundColor: accent }]}>
        <Icon name="book-open" size={14} color={colors.white} />
      </View>
      <View style={styles.content}>
        <View>
          <Text style={styles.topic}>Quadratic Equations</Text>
          <Text style={styles.teacher}>Tr. Sarah Namusoke</Text>
          <Text style={styles.subject}>Mathematics</Text>
          <Text style={styles.description}>
            Step-by-step notes covering factorization, roots and graph behavior.
          </Text>
        </View>
        <View style={styles.footer}>
          <View style={styles.metaRow}>
            <Text style={styles.meta}>12 Pages</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>PDF</Text>
            <Text style={styles.dot}>•</Text>
            <Text style={styles.meta}>Updated 3 days ago</Text>
          </View>
          <Pressable
            style={styles.iconButton}
            accessibilityLabel="Download note"
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
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.white,
    minHeight: 280,
    ...shadows.card,
    marginBottom: spacing.xl,
  },
  image: { width: "100%", height: 280, position: "absolute" },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.25)" },
  badge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    padding: spacing.lg,
    zIndex: 1,
  },
  topic: {
    color: colors.white,
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 2,
  },
  teacher: {
    color: "#F1F5F9",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
  },
  subject: {
    color: "#FDE68A",
    fontSize: 13,
    fontWeight: "700",
    marginBottom: 10,
  },
  description: {
    color: "#F8FAFC",
    fontSize: 13,
    lineHeight: 20,
    maxWidth: 260,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    flex: 1,
  },
  meta: { color: "#F8FAFC", fontSize: 11, fontWeight: "600" },
  dot: { color: "#F8FAFC", marginHorizontal: 6 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
  },
});
