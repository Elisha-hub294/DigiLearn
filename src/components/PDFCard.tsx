import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { type ResourceItem } from "../constants/homeData";
import { colors, radius, shadows, spacing } from "../constants/theme";

export const PDFCard = ({
  item,
  compact = false,
}: {
  item: ResourceItem;
  compact?: boolean;
}) => (
  <Animated.View
    entering={FadeInUp.duration(500)}
    style={[styles.card, compact && styles.compact]}
  >
    <View style={styles.imageWrap}>
      <Image
        source={item.previewImage}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.overlay} />
      <View style={[styles.badge, { backgroundColor: item.accent }]}>
        <Text style={styles.badgeText}>{item.subject}</Text>
      </View>
    </View>
    <View style={styles.body}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.meta}>{item.metadata}</Text>
      <View style={styles.footer}>
        <Pressable
          style={styles.action}
          accessibilityLabel={`Download ${item.title}`}
        >
          <Icon name="download" size={15} color={colors.white} />
        </Pressable>
      </View>
    </View>
  </Animated.View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    overflow: "hidden",
    ...shadows.card,
    marginBottom: spacing.md,
  },
  compact: { marginBottom: spacing.md },
  imageWrap: { height: 154, position: "relative" },
  image: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.25)" },
  badge: {
    position: "absolute",
    top: spacing.md,
    left: spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  badgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
  body: { padding: spacing.md },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 6,
  },
  meta: { color: colors.subtitle, fontSize: 12, lineHeight: 18 },
  footer: { marginTop: spacing.md, alignItems: "flex-end" },
  action: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
});
