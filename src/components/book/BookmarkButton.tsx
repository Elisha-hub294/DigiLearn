import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet } from "react-native";

export function BookmarkButton({ selected, onPress }: { selected: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={selected ? "Remove bookmark" : "Bookmark book"} onPress={onPress} style={styles.button}><Feather name="bookmark" size={22} color={selected ? "#147B5B" : "#344054"} fill={selected ? "#147B5B" : "transparent"} /></Pressable>;
}
const styles = StyleSheet.create({ button: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", backgroundColor: "#F1F7F4" } });
