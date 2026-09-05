import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { SourceBook } from "./pageTypes";
import { SourceBookCard } from "./SourceBookCard";

export function SourceBooks({
  books,
  onSelectBook,
}: {
  books: SourceBook[];
  onSelectBook: (id: string) => void;
}) {
  const { colors } = useTheme();
  if (!books || books.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.heading, { color: colors.text }]}>Source</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {books.map((book, index) => (
          <SourceBookCard
            key={book.id}
            book={book}
            index={index}
            onPress={() => onSelectBook(book.id)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 28,
  },
  heading: {
    fontSize: 21,
    fontWeight: "600",
    marginBottom: 14,
  },
  list: {
    paddingRight: 24,
  },
});
