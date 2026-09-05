import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";
import { ResourceDeleteMenu } from "../ui/ResourceDeleteMenu";

type PaperCardProps = {
  id?: string;
  title: string;
  width?: number;
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
  owner?: string;
  onDeleted?: () => void;
};

export function PaperCard({
  id,
  title,
  width,
  image,
  document,
  subject,
  year,
  description,
  level,
  pageNumber,
  paperCode,
  paperNumber,
  owner,
  onDeleted,
}: PaperCardProps) {
  const router = useRouter();
  const { colors: themeColors } = useTheme();

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
    <View
      style={[
        styles.card,
        { backgroundColor: themeColors.white, borderColor: themeColors.border },
        width !== undefined && { width },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        style={({ pressed, hovered }) => [
          styles.cardPressable,
          hovered && styles.cardHovered,
          pressed && styles.cardPressed,
        ]}
        onPress={openPreview}
      >
        <View style={styles.previewContainer}>
          {image ? (
            <Image
              source={{ uri: image }}
              style={styles.preview}
              contentFit="cover"
              contentPosition="top left"
            />
          ) : (
            <View
              style={[
                styles.preview,
                styles.previewFallback,
                { backgroundColor: themeColors.border },
              ]}
            />
          )}
          <View style={styles.darkOverlay} />
        </View>
        <View style={styles.content}>
          {subject?.trim() ? (
            <Text style={[styles.subject, { color: themeColors.primary }]}>
              {subject.trim()}
            </Text>
          ) : null}
          <Text
            style={[styles.title, { color: themeColors.text }]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {metaParts.length > 0 && (
            <Text
              style={[styles.meta, { color: themeColors.subtitle }]}
              numberOfLines={2}
            >
              {metaParts.join(" • ")}
            </Text>
          )}
        </View>
      </Pressable>
      <View style={styles.menu}>
        <ResourceDeleteMenu
          collection="pastPaper"
          id={id ?? title}
          title={title}
          data={{ owner, cover: image, document }}
          onDeleted={onDeleted}
          light
        />
      </View>
    </View>
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
    position: "relative",
  },
  cardPressable: {
    width: "100%",
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.995 }],
  },
  cardHovered: {
    opacity: 0.98,
    transform: [{ scale: 1.01 }],
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
  menu: { position: "absolute", top: 6, right: 6 },
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
    textTransform: "capitalize",
  },
  meta: {
    color: colors.subtitle,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 6,
  },
});
