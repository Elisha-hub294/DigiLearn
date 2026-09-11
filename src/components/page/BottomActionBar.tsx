import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../../contexts/ThemeContext";
import { BookmarkButton } from "./BookmarkButton";
import { OpenButton } from "./OpenButton";
import { ShareButton } from "./ShareButton";

export function BottomActionBar({
  bookmarked,
  onBookmark,
  onOpen,
  onShare,
  accentColor = "#000000",
  openLabel = "Open",
}: {
  bookmarked: boolean;
  onBookmark: () => void;
  onOpen: () => void;
  onShare: () => void;
  accentColor?: string;
  openLabel?: string;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.white,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      <ShareButton onPress={onShare} accentColor={accentColor} />
      <OpenButton onPress={onOpen} accentColor={accentColor} label={openLabel} />
      <BookmarkButton
        selected={bookmarked}
        onPress={onBookmark}
        accentColor={accentColor}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    boxShadow: "0px -5px 18px rgba(15, 23, 42, 0.12)",
    elevation: 12,
  },
});
