import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { BookmarkButton } from "./BookmarkButton";
import { GradientButton } from "./GradientButton";

export function BottomActionBar({ gradient, bookmarked, onBookmark }: { gradient: readonly [string, string]; bookmarked: boolean; onBookmark: () => void }) {
  return <View style={styles.bar}><Pressable accessibilityRole="button" accessibilityLabel="Share book" style={styles.icon}><Feather name="share-2" size={21} color="#15966B" /></Pressable><GradientButton colors={gradient} onPress={() => {}} /><BookmarkButton selected={bookmarked} onPress={onBookmark} /></View>;
}
const styles = StyleSheet.create({ bar: { minHeight: 92, flexDirection: "row", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12, backgroundColor: "#fff", borderTopLeftRadius: 26, borderTopRightRadius: 26, shadowColor: "#0F172A", shadowOpacity: .14, shadowRadius: 16, shadowOffset: { width: 0, height: -5 }, elevation: 15 }, icon: { width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "#EFFAF4" } });
