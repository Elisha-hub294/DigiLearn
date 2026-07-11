import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { TrendingVideoCard, VideoLesson } from './TrendingVideoCard';

export function TrendingCarousel({ items, cardWidth }: { items: VideoLesson[]; cardWidth: number }) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(items.length);
  const [isInteracting, setIsInteracting] = useState(false);
  const data = useMemo(() => [...items, ...items, ...items], [items]);
  const itemWidth = cardWidth + 14;

  useEffect(() => {
    if (data.length === 0 || isInteracting) return;

    const interval = setInterval(() => {
      const N = items.length;
      let current = currentIndex;

      // If we are at the end boundary, silently warp back to the middle segment first
      if (current >= 2 * N) {
        current = (current % N) + N;
        flatListRef.current?.scrollToOffset({ offset: current * itemWidth, animated: false });
      }

      const nextIndex = current + 1;
      flatListRef.current?.scrollToOffset({ offset: nextIndex * itemWidth, animated: true });
      setCurrentIndex(nextIndex);
    }, 3500);

    return () => clearInterval(interval);
  }, [currentIndex, data.length, itemWidth, isInteracting, items.length]);

  const handleScrollEnd = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / itemWidth);
    
    const N = items.length;
    if (N > 0) {
      if (index < N || index >= 2 * N) {
        const targetIndex = (index % N) + N;
        flatListRef.current?.scrollToOffset({ offset: targetIndex * itemWidth, animated: false });
        setCurrentIndex(targetIndex);
      } else {
        setCurrentIndex(index);
      }
    } else {
      setCurrentIndex(index);
    }
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
        renderItem={({ item }) => <TrendingVideoCard item={item} width={cardWidth} />}
        contentContainerStyle={styles.content}
        decelerationRate="fast"
        snapToInterval={itemWidth}
        snapToAlignment="start"
        initialScrollIndex={items.length}
        getItemLayout={(_, index) => ({
          length: itemWidth,
          offset: itemWidth * index,
          index,
        })}
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
  wrap: { marginRight: -24 },
  content: { paddingRight: 30 },
});
