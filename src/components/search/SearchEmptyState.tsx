import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type SearchEmptyStateProps = {
  title?: string;
  subtitle?: string;
};

export function SearchEmptyState({
  title = "No results found",
  subtitle = "Try searching for another topic, book, author, or paper.",
}: SearchEmptyStateProps) {
  return (
    <View style={styles.container}>
      <Image
        source={{
          uri: "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/images/empty.png",
        }}
        style={styles.illustration}
        contentFit="contain"
      />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
    width: "100%",
  },
  illustration: {
    width: 200,
    height: 160,
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#202020",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "400",
    color: "#777777",
    textAlign: "center",
    lineHeight: 20,
    maxWidth: 300,
  },
});
