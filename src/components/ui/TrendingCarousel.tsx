import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { TrendingVideoCard, VideoLesson } from './TrendingVideoCard';

export function TrendingCarousel({ items, cardWidth }: { items: VideoLesson[]; cardWidth: number }) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const data = useMemo(() => [...items, ...items, ...items], [items]);
  const itemWidth = cardWidth + 14;

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
        renderItem={({ item }) => <TrendingVideoCard item={item} width={cardWidth} />}
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
  wrap: { marginRight: -24 },
  content: { paddingRight: 30 },
});
