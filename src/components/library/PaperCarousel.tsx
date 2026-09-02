import { FlatList, StyleSheet } from "react-native";
import { spacing } from "../../constants/theme";
import { PaperCard } from "./PaperCard";

type PaperItem = {
  id: string;
  title: string;
  subject?: string;
  year?: string;
  pages?: string;
  image?: any;
  document?: string;
  description?: string;
  level?: string;
  pageNumber?: string | number;
  paperCode?: string;
  paperNumber?: string | number;
};

type PaperCarouselProps = {
  items: PaperItem[];
  onSeeAll?: () => void;
};

export function PaperCarousel({ items }: PaperCarouselProps) {
  return (
    <FlatList
      data={items}
      horizontal
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      renderItem={({ item }) => (
        <PaperCard
          key={item.id}
          id={item.id}
          title={item.title}
          subject={item.subject}
          year={item.year}
          pages={item.pages}
          description={item.description}
          level={item.level}
          pageNumber={item.pageNumber}
          paperCode={item.paperCode}
          paperNumber={item.paperNumber}
          image={item.image}
          document={item.document}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    paddingRight: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
