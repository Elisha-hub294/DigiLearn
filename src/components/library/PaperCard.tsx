import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";
import PdfPreview from "../home/PdfPreview";

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
  const router = useRouter();

  const openPdf = () => {
    if (!document) return;
    router.push({
      pathname: "/pdf-reader",
      params: { uri: document, title },
    } as any);
  };

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed, hovered }: any) => [
        styles.card,
        (pressed || hovered) && styles.cardPressed,
      ]}
      onPress={openPdf}
    >
      <View style={styles.previewContainer}>
        {document ? (
          <PdfPreview uri={document} style={styles.preview} />
        ) : (
          <Image source={image} style={styles.preview} contentFit="cover" />
        )}
        <View style={styles.darkOverlay} />
      </View>
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
    backgroundColor: colors.white,
    overflow: "hidden",
  },
  cardPressed: {
    backgroundColor: "#F3F4F6",
  },
  previewContainer: {
    width: "100%",
    height: 130,
    position: "relative",
  },
  preview: {
    width: "100%",
    height: "100%",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
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
    fontWeight: "500",
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
