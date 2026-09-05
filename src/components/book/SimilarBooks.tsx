import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Book } from "./bookTypes";
import { SimilarBookCard } from "./SimilarBookCard";

export function SimilarBooks({
  books,
  onSelect,
}: {
  books: Book[];
  onSelect: (id: string) => void;
}) {
  const { colors } = useTheme();
  if (!books.length) return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: colors.text }]}>
        Similar Books
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {books.map((book, index) => (
          <SimilarBookCard
            key={book.id}
            book={book}
            index={index}
            onPress={() => onSelect(book.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: 30 },
  heading: {
    fontSize: 21,
    fontWeight: "500",
    marginBottom: 14,
  },
  list: { paddingRight: 24 },
});
