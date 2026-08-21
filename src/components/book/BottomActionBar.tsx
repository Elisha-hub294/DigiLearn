import { Feather } from "@expo/vector-icons";
import { Pressable, StyleSheet, View } from "react-native";
import { BookmarkButton } from "./BookmarkButton";
import { GradientButton } from "./GradientButton";

export function BottomActionBar({ gradient, bookmarked, onBookmark }: { gradient: readonly [string, string]; bookmarked: boolean; onBookmark: () => void }) {
  return <View style={styles.bar}><Pressable accessibilityRole="button" accessibilityLabel="Share book" style={styles.icon}><Feather name="share-2" size={21} color="#15966B" /></Pressable><GradientButton colors={gradient} onPress={() => { }} /><BookmarkButton selected={bookmarked} onPress={onBookmark} /></View>;
}
const styles = StyleSheet.create({ bar: { minHeight: 92, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, backgroundColor: "#fff" }, icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", backgroundColor: "#EFFAF4" } });
