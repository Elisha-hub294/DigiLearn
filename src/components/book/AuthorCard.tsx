import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { DEFAULT_AUTHOR_AVATAR, OPERO_AVATAR } from "./bookTypes";

export function AuthorCard({ name, index }: { name: string; index: number }) {
  const source = name.trim().toLowerCase() === "opero stephen" ? OPERO_AVATAR : DEFAULT_AUTHOR_AVATAR;
  return <Animated.View entering={FadeInUp.delay(index * 70).duration(300)} style={styles.card}><Image source={source} style={styles.avatar} contentFit="cover" /><Text style={styles.name} numberOfLines={2}>{name}</Text></Animated.View>;
}
const styles = StyleSheet.create({ card: { width: 82, alignItems: "center", marginRight: 18 }, avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#E8EDF0" }, name: { color: "#44515A", fontSize: 13, fontWeight: "600", textAlign: "center", marginTop: 8 } });
