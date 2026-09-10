import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { BookmarkButton } from "./BookmarkButton";
import { GradientButton } from "./GradientButton";

export function BottomActionBar({
  gradient,
  bookmarked,
  onGetYours,
  onBookmark,
  onShare,
  onPreview,
}: {
  gradient: readonly [string, string];
  bookmarked: boolean;
  onGetYours: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onPreview?: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.white }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share book"
        style={[styles.icon, { backgroundColor: colors.lightBackground }]}
        onPress={onShare}
      >
        <Feather name="share-2" size={21} color={colors.primary} />
      </Pressable>
      {onPreview ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Preview pages"
          style={[styles.preview, { borderColor: colors.primary }]}
          onPress={onPreview}
        >
          <Feather name="book-open" size={17} color={colors.primary} />
          <Text style={[styles.previewText, { color: colors.primary }]}>
            Preview
          </Text>
        </Pressable>
      ) : null}
      <GradientButton colors={gradient} onPress={onGetYours} />
      <BookmarkButton selected={bookmarked} onPress={onBookmark} />
    </View>
  );
}
const styles = StyleSheet.create({
  bar: {
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 12,
  },
  icon: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  preview: {
    height: 44,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 5,
  },
  previewText: { fontSize: 12, fontWeight: "700" },
});
