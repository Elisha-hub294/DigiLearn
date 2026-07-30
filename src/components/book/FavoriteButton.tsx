import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

export function FavoriteButton({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={selected ? "Remove from favourites" : "Add to favourites"} onPress={onPress} style={styles.button} hitSlop={8}><Feather name="star" size={22} color="#fff" style={selected ? { color: "#FFD65A" } : undefined} /></Pressable>;
}
const styles = StyleSheet.create({ button: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.28)" } });
