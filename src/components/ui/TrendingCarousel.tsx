import { getHorizontalPadding } from '@/constants/layout';
import { spacing } from '@/constants/theme';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, useWindowDimensions, View } from 'react-native';
import { TrendingVideoCard, VideoLesson } from './TrendingVideoCard';

export function getTrendingCardWidth(width: number, contentWidth: number): number {
  if (width < 600) {
    return Math.max(220, Math.min(contentWidth * 0.82, 300));
  }
  if (width < 900) {
    return Math.max(260, Math.min(contentWidth * 0.48, 340));
  }
  return Math.max(280, Math.min(contentWidth * 0.32, 360));
}

export function TrendingCarousel({ items, cardWidth }: { items: VideoLesson[]; cardWidth?: number }) {
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const data = useMemo(() => [...items, ...items, ...items], [items]);

  const horizontalPadding = getHorizontalPadding(width);
  const contentMaxWidth = Math.min(1100, width - horizontalPadding * 2);
  const contentWidth = Math.min(width, contentMaxWidth) - horizontalPadding * 2;
  const activeCardWidth = cardWidth ?? getTrendingCardWidth(width, contentWidth);

  const itemWidth = activeCardWidth + 14;

  useEffect(() => {
    if (data.length === 0 || isInteracting) return;

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % data.length;
      if (nextIndex === 0) {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
      } else {
        flatListRef.current?.scrollToOffset({ offset: nextIndex * itemWidth, animated: true });
      }
      setCurrentIndex(nextIndex);
    }, 3500);

    return () => clearInterval(interval);
  }, [currentIndex, data.length, itemWidth, isInteracting]);

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / itemWidth);
    setCurrentIndex(index);
    setIsInteracting(false);
  };

  return (
    <View style={styles.wrap}>
      <FlatList
        ref={flatListRef}
        data={data}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => <TrendingVideoCard item={item} width={activeCardWidth} />}
        contentContainerStyle={styles.content}
        decelerationRate="fast"
        snapToInterval={itemWidth}
        snapToAlignment="start"
        onTouchStart={() => setIsInteracting(true)}
        onTouchEnd={() => setIsInteracting(false)}
        onTouchCancel={() => setIsInteracting(false)}
        onScrollBeginDrag={() => setIsInteracting(true)}
        onScrollEndDrag={(e) => {
          handleScrollEnd(e);
        }}
        onMomentumScrollEnd={handleScrollEnd}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  content: { paddingRight: spacing.md, marginBottom: spacing.xl },
});
