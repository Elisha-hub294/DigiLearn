import { FlatList, StyleSheet } from "react-native";
import type { BookItem } from "../../constants/homeData";
import { spacing } from "../../constants/theme";
import { BookCard } from "../library/BookCard";

type RecommendedBookCarouselProps = {
  data: BookItem[];
};

export const RecommendedBookCarousel = ({
  data,
}: RecommendedBookCarouselProps) => {
  return (
    <FlatList
      horizontal
      data={data}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={({ item }) => (
        <BookCard
          item={{
            ...item,
            description: "",
          }}
        />
      )}
      contentContainerStyle={styles.list}
      decelerationRate="fast"
      snapToAlignment="start"
      snapToInterval={240}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    paddingRight: spacing.lg,
  },
});
