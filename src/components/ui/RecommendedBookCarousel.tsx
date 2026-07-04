import { useRef } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import Animated, { useAnimatedScrollHandler, useSharedValue } from 'react-native-reanimated';
import { spacing } from '../../constants/theme';
import { BookCard, BookItem } from './BookCard';

type RecommendedBookCarouselProps = {
  data: BookItem[];
};

export const RecommendedBookCarousel = ({ data }: RecommendedBookCarouselProps) => {
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<FlatList<BookItem>>(null);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  return (
    <Animated.FlatList
      ref={flatListRef}
      horizontal
      data={[...data, ...data]}
      showsHorizontalScrollIndicator={false}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={({ item, index }) => <BookCard item={item} index={index} scrollX={scrollX} />}
      contentContainerStyle={styles.list}
      onScroll={onScroll}
      scrollEventThrottle={16}
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
