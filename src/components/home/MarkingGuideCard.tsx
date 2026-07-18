import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, radius, spacing } from "../../constants/theme";

export const MarkingGuideCard = () => {
  return (
    <Animated.View entering={FadeInUp.duration(740)} style={styles.card}>
      <View style={styles.previewWrap}>
        <Image
          source={require("../../../assets/images/pdf-preview.jpeg")}
          style={styles.preview}
          contentFit="cover"
        />
        <View style={styles.overlay} />
        <View style={[styles.badge, { backgroundColor: "#B45F06" }]}>
          <Text style={styles.badgeText}>History</Text>
        </View>
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>History Marking Guide</Text>
        <Text style={styles.meta}>10 pages • PDF • Updated 2 days ago</Text>
        <View style={styles.footer}>
          <Text style={styles.status}>Download now</Text>
          <LinearGradient
            colors={["#3B82F6", "#f65cee"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.downloadButton}
          >
            <Pressable accessibilityLabel="Download marking guide">
              <Icon name="download" size={15} color={colors.white} />
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  previewWrap: { position: "relative", height: 200 },
  preview: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.2)" },
  badge: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "500" },
  content: { padding: spacing.sm },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 6,
  },
  meta: {
    color: colors.subtitle,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  status: { color: colors.text, fontSize: 12, fontWeight: "700" },
  downloadButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.primary,
  },
});
