import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

type SearchHeaderProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onClear?: () => void;
};

export function SearchHeader({
  value,
  onChangeText,
  onSubmit,
  onClear,
}: SearchHeaderProps) {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={8}
        onPress={() => router.back()}
        style={styles.backButton}
      >
        <Feather name="arrow-left" size={22} color="#111111" />
      </Pressable>

      <View style={styles.searchBar}>
        <TextInput
          accessibilityLabel="Search pages, books, authors"
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          placeholder="Search pages, books, authors etc"
          placeholderTextColor="#8B8B8B"
          style={styles.input}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={true}
        />

        {value.length > 0 && onClear && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search text"
            onPress={onClear}
            style={styles.clearButton}
          >
            <Feather name="x" size={16} color="#8B8B8B" />
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Submit search"
          onPress={onSubmit}
          style={styles.searchButton}
        >
          <Feather name="search" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    paddingVertical: 8,
    gap: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: "#111111",
    backgroundColor: "#FFFFFF",
    paddingLeft: 16,
    paddingRight: 4,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    fontWeight: "500",
    color: "#111111",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 6,
    marginRight: 4,
  },
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
  },
});
