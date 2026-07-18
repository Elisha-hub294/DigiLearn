import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, radius, spacing } from "../../constants/theme";

export const TeacherPostCard = () => {
  const { width } = useWindowDimensions();
  const isWide = width >= 900;

  return (
    <Animated.View
      entering={FadeInUp.duration(500)}
      style={[styles.card, isWide && styles.cardWide]}
    >
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <Image
            source={require("../../../assets/images/tr-2.jpg")}
            style={styles.avatar}
            contentFit="cover"
          />
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.name}>Tr. Daniel Kato</Text>
              <Icon name="check-circle" size={14} color={colors.primary} />
            </View>
            <Text style={styles.time}>2 hours ago</Text>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: "#4C7CF0" }]}>
          <Text style={styles.badgeText}>Physics</Text>
        </View>
      </View>

      <Text style={styles.caption}>
        Shared a fresh PDF pack with revised examples and exam-focused notes.
      </Text>

      <View style={styles.previewWrap}>
        <Image
          source={require("../../../assets/images/pdf-preview.jpeg")}
          style={styles.preview}
          contentFit="cover"
        />
        <View style={styles.overlay} />
        <View style={styles.previewTag}>
          <Text style={styles.previewTagText}>PDF</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <Action icon="star" label="Like" />
        <Action icon="bookmark" label="Bookmark" />
        <Action icon="share-2" label="Share" />
      </View>
    </Animated.View>
  );
};

const Action = ({ icon, label }: { icon: any; label: string }) => (
  <View style={styles.actionItem}>
    <Icon name={icon} size={15} color={colors.subtitle} />
    <Text style={styles.actionLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    width: "100%",
    alignSelf: "center",
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  cardWide: {
    maxWidth: 760,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: spacing.md,
  },
  profileRow: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 10, marginRight: spacing.sm },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  name: { color: colors.text, fontSize: 14, fontWeight: "500" },
  time: { color: colors.subtitle, fontSize: 12, marginTop: 2 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  caption: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  previewWrap: {
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    marginBottom: spacing.md,
  },
  preview: { width: "100%", height: 220, borderRadius: 10 },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.2)" },
  previewTag: {
    position: "absolute",
    left: spacing.md,
    top: spacing.md,
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  previewTagText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-start",
    flexWrap: "wrap",
    gap: 8,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: colors.background,
  },
  actionLabel: { color: colors.subtitle, fontSize: 12, fontWeight: "500" },
});
