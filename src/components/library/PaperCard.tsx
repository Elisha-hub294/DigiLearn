import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";

type PaperCardProps = {
  title: string;
  subject?: string;
  year?: string;
  pages?: string;
  image?: string;
  document?: string;
  description?: string;
  level?: string;
  pageNumber?: string | number;
  paperCode?: string;
  paperNumber?: string | number;
};

export function PaperCard({
  title,
  image,
  document,
  subject,
  description,
  level,
  pageNumber,
  paperCode,
  paperNumber,
}: PaperCardProps) {
  const router = useRouter();

  const normalizedPaperCode = paperCode?.trim();
  const normalizedPaperNumber =
    typeof paperNumber === "number"
      ? String(paperNumber)
      : paperNumber?.trim();
  const paperReference = normalizedPaperCode
    ? normalizedPaperNumber
      ? `${normalizedPaperCode}/${normalizedPaperNumber}`
      : normalizedPaperCode
    : "";

  const normalizedPageNumber =
    typeof pageNumber === "number"
      ? String(pageNumber)
      : pageNumber?.trim();
  const pageCountText = normalizedPageNumber
    ? `${normalizedPageNumber} ${Number(normalizedPageNumber) === 1 ? "page" : "pages"}`
    : "";

  const details = [
    subject?.trim() || "",
    paperReference,
    level?.trim() || "",
    pageCountText,
    description?.trim() || "",
  ].filter(Boolean);

  const openPdf = () => {
    if (!document) return;
    router.push({
      pathname: "/pdf-reader",
      params: { uri: encodeURIComponent(document), title },
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
        {image ? (
          <Image
            source={{ uri: image }}
            style={styles.preview}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.preview, styles.previewFallback]} />
        )}
        <View style={styles.darkOverlay} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {details.length > 0 && (
          <View style={styles.details}>
            {details.map((detail, index) => (
              <Text key={`${detail}-${index}`} style={styles.detailText} numberOfLines={2}>
                {detail}
              </Text>
            ))}
          </View>
        )}
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
    borderRadius: 12,
  },
  cardPressed: {
    opacity: 0.9,
  },
  previewContainer: {
    width: "100%",
    height: 150,
    position: "relative",
  },
  preview: {
    width: "100%",
    height: "100%",
    backgroundColor: "#E5E7EB",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  previewFallback: {
    backgroundColor: "#D1D5DB",
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  details: {
    marginTop: spacing.xs,
    gap: 2,
  },
  detailText: {
    color: colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
