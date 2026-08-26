import { useCallback, useMemo, useState } from "react";
import { FlatList, StyleSheet, type ViewToken } from "react-native";
import { spacing } from "../../constants/theme";
import { PaperCard } from "./PaperCard";

type PaperItem = {
  id: string;
  title: string;
  subject: string;
  year: string;
  pages: string;
  image: any;
  document?: string;
};

type PaperCarouselProps = {
  items: PaperItem[];
  onSeeAll?: () => void;
};

export function PaperCarousel({ items }: PaperCarouselProps) {
  const [visiblePaperIds, setVisiblePaperIds] = useState<Set<string>>(
    () => new Set(),
  );
  const viewabilityConfig = useMemo(
    () => ({ itemVisiblePercentThreshold: 1 }),
    [],
  );
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      setVisiblePaperIds(
        new Set(
          viewableItems
            .map((token) => (token.item as PaperItem | undefined)?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      );
    },
    [],
  );

  return (
    <FlatList
      data={items}
      horizontal
      keyExtractor={(item) => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      viewabilityConfig={viewabilityConfig}
      onViewableItemsChanged={onViewableItemsChanged}
      renderItem={({ item }) => (
        <PaperCard
          key={item.id}
          title={item.title}
          subject={item.subject}
          year={item.year}
          pages={item.pages}
          image={item.image}
          document={item.document}
          isVisible={visiblePaperIds.has(item.id)}
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
