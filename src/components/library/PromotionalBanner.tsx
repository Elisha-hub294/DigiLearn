import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, spacing } from "../../constants/theme";

type PromotionalBannerProps = {
  title: string;
  description: string;
  image: any;
  avatar: any;
};

export function PromotionalBanner({
  title,
  description,
  image,
  avatar,
}: PromotionalBannerProps) {
  return (
    <Pressable accessibilityRole="button" style={styles.card}>
      <Image source={image} style={styles.image} contentFit="cover" />
      <LinearGradient
        colors={["rgba(0,0,0,0.85)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.overlay}
      />
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
        <View style={styles.footer}>
          <View style={styles.exploreButton}>
            <Text style={styles.exploreText}>Explore</Text>
          </View>
          <View style={styles.avatarContainer}>
            <Image source={avatar} style={styles.avatar} contentFit="cover" />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 220,
    borderRadius: radius.md,
    overflow: "hidden",
    marginBottom: spacing.xl,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  title: {
    color: colors.white,
    fontSize: 40,
    fontWeight: "700",
    marginBottom: spacing.xs,
  },
  description: {
    color: "rgba(255,255,255,0.86)",
    fontSize: 15,
    lineHeight: 18,
    marginBottom: spacing.md,
    maxWidth: 300,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exploreButton: {
    borderWidth: 1,
    borderColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  exploreText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  avatarContainer: {},
  avatar: {
    width: 70,
    height: 70,
    borderRadius: radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
});
