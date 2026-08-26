import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { colors, spacing } from "../../constants/theme";
import PdfPreview from "../home/PdfPreview";

type PaperCardProps = {
  title: string;
  subject: string;
  year: string;
  pages: string;
  image: any;
  document?: string;
  isVisible?: boolean;
};

export function PaperCard({
  title,
  subject,
  year,
  pages,
  image: _image,
  document,
  isVisible = false,
}: PaperCardProps) {
  const router = useRouter();
  const [loadedPdfUri, setLoadedPdfUri] = useState<string | null>(null);
  const pdfLoading = Boolean(
    document && isVisible && loadedPdfUri !== document,
  );

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
          <PdfPreview
            uri={document}
            style={styles.preview}
            showLoadingIndicator={false}
            onLoad={() => setLoadedPdfUri(document ?? null)}
            onError={() => setLoadedPdfUri(document ?? null)}
          />
        ) : (
          <View style={[styles.preview, styles.previewFallback]} />
        )}
        {pdfLoading ? (
          <View style={styles.pdfLoading}>
            <ActivityIndicator color="#FFFFFF" />
          </View>
        ) : null}
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
  previewFallback: { backgroundColor: "#D1D5DB" },
  pdfLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(209, 213, 219, 0.75)",
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
