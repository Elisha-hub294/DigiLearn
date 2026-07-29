import { Image } from "expo-image";
import React from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, radius, shadows, spacing } from "../../constants/theme";

type PaperCardProps = {
  title: string;
  subject: string;
  year: string;
  pages: string;
  image: any;
  document?: string;
};

export function PaperCard({
  title,
  subject,
  year,
  pages,
  image,
  document,
}: PaperCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      style={styles.card}
      onPress={() => {
        if (document) {
          Linking.openURL(document).catch((error) =>
            console.error("Couldn't open paper", error),
          );
        }
      }}
    >
      <Image source={image} style={styles.preview} contentFit="cover" />
      <View style={styles.content}>
        <Text style={styles.subject}>{subject}</Text>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{year}</Text>
          <Text style={styles.meta}>{pages}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 220,
    marginRight: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    overflow: "hidden",
    ...shadows.card,
  },
  preview: {
    width: "100%",
    height: 130,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  subject: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  meta: {
    color: colors.subtitle,
    fontSize: 12,
  },
});
