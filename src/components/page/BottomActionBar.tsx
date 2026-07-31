import React from "react";
import { StyleSheet, View } from "react-native";
import { BookmarkButton } from "./BookmarkButton";
import { OpenButton } from "./OpenButton";
import { ShareButton } from "./ShareButton";

export function BottomActionBar({
  bookmarked,
  onBookmark,
  onOpen,
  onShare,
}: {
  bookmarked: boolean;
  onBookmark: () => void;
  onOpen: () => void;
  onShare: () => void;
}) {
  return (
    <View style={styles.bar}>
      <ShareButton onPress={onShare} />
      <OpenButton onPress={onOpen} />
      <BookmarkButton selected={bookmarked} onPress={onBookmark} />
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
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: "#0F172A",
    shadowOpacity: 0.14,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: -5 },
    elevation: 16,
  },
});
