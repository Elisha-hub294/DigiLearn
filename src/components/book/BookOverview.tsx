import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Book } from "./bookTypes";

export function BookOverview({ book }: { book: Book }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[styles.heading, { color: colors.text }]}>
        Book Overview
      </Text>
      <Text style={[styles.description, { color: colors.subtitle }]}>
        {book.description || "No overview is available for this book yet."}
      </Text>
      <View style={styles.stats}>
        {book.pages ? (
          <Text style={[styles.stat, { color: colors.subtitle }]}>
            <Feather name="file-text" size={14} /> {book.pages} pages
          </Text>
        ) : null}
        {/* {book.rating ? (
          <Text style={[styles.stat, { color: colors.subtitle }]}>
            <Feather name="star" size={14} color="#E8A600" />{" "}
            {book.rating.toFixed(1)}
          </Text>
        ) : null} */}
        {typeof book.saves === "number" ? (
          <Text style={styles.stat}>
            <Feather name="heart" size={14} /> {book.saves} saved
          </Text>
        ) : null}
      </View>
      <View style={styles.chips}>
        {book.subject.map((subject) => (
          <View
            key={subject}
            style={[styles.chip, { backgroundColor: colors.primaryLight }]}
          >
            <Text style={[styles.chipText, { color: colors.primary }]}>
              {subject}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  heading: {
    fontSize: 21,
    fontWeight: "500",
    marginBottom: 14,
  },
  description: { fontSize: 16, lineHeight: 28 },
  stats: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 18 },
  stat: { fontSize: 13, fontWeight: "600" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  chip: {
    borderRadius: 99,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipText: { fontWeight: "700", fontSize: 12 },
});
