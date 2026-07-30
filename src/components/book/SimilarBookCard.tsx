import { Image } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { Book, FALLBACK_COVER } from "./bookTypes";

export function SimilarBookCard({ book, onPress, index }: { book: Book; onPress: () => void; index: number }) { return <Animated.View entering={FadeIn.delay(index * 70).duration(300)}><Pressable accessibilityRole="button" accessibilityLabel={`Open ${book.title}`} onPress={onPress} style={styles.card}><Image source={book.cover} placeholder={FALLBACK_COVER} style={styles.cover} contentFit="cover" transition={180} /><Text style={styles.title} numberOfLines={2}>{book.title}</Text></Pressable></Animated.View>; }
const styles = StyleSheet.create({ card: { width: 72, marginRight: 14 }, cover: { width: 72, height: 110, borderRadius: 10, backgroundColor: "#E9EDF0", shadowColor: "#0F172A", shadowOpacity: .16, shadowRadius: 7, shadowOffset: { width: 0, height: 3 }, elevation: 3 }, title: { color: "#344054", fontSize: 12, lineHeight: 16, fontWeight: "600", marginTop: 8 } });
