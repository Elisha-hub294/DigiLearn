import React from "react";
import { StyleSheet, Text, View } from "react-native";

export function OverviewSection({ description }: { description?: string }) {
  const text =
    description && description.trim()
      ? description
      : "No detailed overview available for this page.";

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Overview</Text>
      <Text style={styles.description}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  heading: {
    fontSize: 21,
    fontWeight: "600",
    color: "#1B2730",
    marginBottom: 12,
  },
  description: {
    color: "#555555",
    fontSize: 16,
    lineHeight: 28,
  },
});
