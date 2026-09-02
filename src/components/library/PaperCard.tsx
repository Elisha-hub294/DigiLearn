import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";

type PaperCardProps = {
  id?: string;
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
  id,
  title,
  image,
  document,
  subject,
  year,
  description,
  level,
  pageNumber,
  paperCode,
  paperNumber,
}: PaperCardProps) {
  const router = useRouter();

  const normalizedPaperCode = paperCode?.trim();
  const normalizedPaperNumber =
    typeof paperNumber === "number" ? String(paperNumber) : paperNumber?.trim();
  const paperReference =
    normalizedPaperCode && normalizedPaperNumber
      ? `${normalizedPaperCode}/${normalizedPaperNumber}`
      : "";

  const normalizedPageNumber =
    typeof pageNumber === "number" ? String(pageNumber) : pageNumber?.trim();
  const pageCountText = normalizedPageNumber
    ? `${normalizedPageNumber} ${Number(normalizedPageNumber) === 1 ? "Page" : "Pages"}`
    : "";

  const displayLevel = (() => {
    const normalizedLevel = level?.trim();

    if (!normalizedLevel) return "";

    const lowerLevel = normalizedLevel.toLowerCase();

    if (lowerLevel === "ordinary") return "O-level";
    if (lowerLevel === "advanced") return "A-level";
    if (lowerLevel === "primary") return "Primary level";

    return normalizedLevel;
  })();

  const metaParts = [paperReference, displayLevel, pageCountText].filter(
    Boolean,
  );

  const openPreview = () => {
    const params = {
      id: id ?? title,
      title,
      subject,
      year,
      description,
      level,
      pageNumber,
      paperCode,
      paperNumber,
      image,
      document,
    } as any;

    router.push({
      pathname: "/paper-preview",
      params,
    });
  };

  return (
    <Pressable
      accessibilityRole="button"
      style={({ pressed, hovered }: any) => [
        styles.card,
        (pressed || hovered) && styles.cardPressed,
      ]}
      onPress={openPreview}
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
        {subject?.trim() ? (
          <Text style={styles.subject}>{subject.trim()}</Text>
        ) : null}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {metaParts.length > 0 && (
          <Text style={styles.meta} numberOfLines={2}>
            {metaParts.join(" • ")}
          </Text>
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
    borderWidth: 1,
    borderColor: "rgba(15, 23, 42, 0.06)",
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
  subject: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "700",
    marginBottom: 4,
  },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 20,
  },
  meta: {
    color: colors.subtitle,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
});
