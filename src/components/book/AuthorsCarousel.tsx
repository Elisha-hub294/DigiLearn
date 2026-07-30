import { ScrollView, StyleSheet, Text, View } from "react-native";
import React from "react";
import { AuthorCard } from "./AuthorCard";

export function AuthorsCarousel({ authors }: { authors: string[] }) { const visibleAuthors = authors.length ? authors : ["Unknown author"]; return <View style={styles.section}><Text style={styles.heading}>Authors</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>{visibleAuthors.map((author, index) => <AuthorCard key={`${author}-${index}`} name={author} index={index} />)}</ScrollView></View>; }
const styles = StyleSheet.create({ section: { marginTop: 30 }, heading: { fontSize: 21, color: "#1B2730", fontWeight: "800", marginBottom: 14 }, list: { paddingRight: 24 } });
