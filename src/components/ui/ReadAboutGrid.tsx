import { useMemo } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { dimensions, spacing } from '../../constants/theme';
import { TopicCard, TopicCardItem } from './TopicCard';

type ReadAboutGridProps = {
  data: TopicCardItem[];
};

export const ReadAboutGrid = ({ data }: ReadAboutGridProps) => {
  const { width } = useWindowDimensions();

  const pages = useMemo(() => {
    const duplicated = [...data, ...data];
    const grouped: TopicCardItem[][] = [];
    for (let index = 0; index < duplicated.length; index += 6) {
      grouped.push(duplicated.slice(index, index + 6));
    }
    return grouped;
  }, [data]);

  return (
    <FlatList
      data={pages}
      horizontal
      showsHorizontalScrollIndicator={false}
      pagingEnabled
      keyExtractor={(_, index) => `page-${index}`}
      renderItem={({ item }) => (
        <View style={[styles.page, { width: Math.min(width - dimensions.screenPaddingHorizontal * 2, 420) }]}> 
          <View style={styles.grid}> 
            {item.map((topic) => (
              <TopicCard key={topic.id} item={topic} />
            ))}
          </View>
        </View>
      )}
      contentContainerStyle={styles.listContent}
      decelerationRate="fast"
      snapToAlignment="start"
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingRight: spacing.lg,
  },
  page: {
    paddingRight: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
});
