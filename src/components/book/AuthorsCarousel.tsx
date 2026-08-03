import { ScrollView, StyleSheet, Text, View } from "react-native";
import { AuthorCard } from "./AuthorCard";

type AuthorItem = string | { name: string; avatar?: string };

export function AuthorsCarousel({ authors }: { authors: AuthorItem[] }) {
  const visibleAuthors = authors.length ? authors : ["Unknown author"];

  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Authors</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {visibleAuthors.map((item, index) => {
          const name = typeof item === "string" ? item : item.name;
          const avatar = typeof item === "string" ? undefined : item.avatar;

          return (
            <AuthorCard
              key={`${name}-${index}`}
              name={name}
              avatar={avatar}
              index={index}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 30 },
  heading: {
    fontSize: 21,
    color: "#1B2730",
    fontWeight: "500",
    marginBottom: 14,
  },
  list: { paddingRight: 24 },
});
