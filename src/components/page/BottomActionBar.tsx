import { StyleSheet, View } from "react-native";
import { BookmarkButton } from "./BookmarkButton";
import { OpenButton } from "./OpenButton";
import { ShareButton } from "./ShareButton";

export function BottomActionBar({
  bookmarked,
  onBookmark,
  onOpen,
  onShare,
  accentColor = "#000000",
}: {
  bookmarked: boolean;
  onBookmark: () => void;
  onOpen: () => void;
  onShare: () => void;
  accentColor?: string;
}) {
  return (
    <View style={styles.bar}>
      <ShareButton onPress={onShare} accentColor={accentColor} />
      <OpenButton onPress={onOpen} accentColor={accentColor} />
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
    minHeight: 92,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
  },
});
