import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { BookmarkButton } from "./BookmarkButton";
import { GradientButton } from "./GradientButton";

export function BottomActionBar({
  gradient,
  bookmarked,
  onGetYours,
  onBookmark,
}: {
  gradient: readonly [string, string];
  bookmarked: boolean;
  onGetYours: () => void;
  onBookmark: () => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: colors.white }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Share book"
        style={[styles.icon, { backgroundColor: colors.lightBackground }]}
      >
        <Feather name="share-2" size={21} color={colors.primary} />
      </Pressable>
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
});
