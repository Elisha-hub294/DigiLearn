import { Feather as Icon } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useRef, useState } from 'react';
import { FlatList, NativeScrollEvent, NativeSyntheticEvent, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { carouselData, CarouselItem } from '../../constants/data';
import { colors, radius, shadows, spacing } from '../../constants/theme';

const CARD_WIDTH_RATIO = 0.84;
const DUPLICATE_COUNT = 3;

export const HeroCarousel = () => {
  const slides = useMemo(() => [...carouselData, ...carouselData, ...carouselData], []);
  const { width } = useWindowDimensions();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<CarouselItem>>(null);
  const snapOffset = width * 0.82;

  const onMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapOffset);
    setActiveIndex(index % carouselData.length);
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={slides}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled={false}
        snapToInterval={snapOffset}
        decelerationRate="fast"
        onMomentumScrollEnd={onMomentumScrollEnd}
        keyExtractor={(_, index) => `carousel-${index}`}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => <CarouselCard item={item} index={index} width={width} />}
      />
      <View style={styles.dots}>
        {carouselData.map((item, index) => (
          <View key={item.id} style={[styles.dot, activeIndex === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
};

const CarouselCard = ({ item, index, width }: { item: CarouselItem; index: number; width: number }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 120 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 120 });
  };

  return (
    <Animated.View style={[styles.card, { width: width * CARD_WIDTH_RATIO, backgroundColor: item.color }, animatedStyle]}>
      <Pressable style={styles.pressable} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <View style={styles.textBlock}>
          <View style={styles.badge}>
            <Icon name="star" size={14} color={colors.primary} />
          </View>
          <View style={{ maxWidth: '90%' }}>
            <Animated.Text style={styles.title}>{item.title}</Animated.Text>
          </View>
          <Pressable style={styles.cta}>
            <Text style={styles.ctaText}>{item.cta}</Text>
          </Pressable>
        </View>
        <Image source={item.image} style={styles.image} contentFit="contain" />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  listContent: {
    paddingRight: 24,
  },
  card: {
    marginRight: 16,
    borderRadius: radius.xl,
    overflow: 'hidden',
    minHeight: 220,
    padding: spacing.lg,
    ...shadows.card,
  },
  pressable: {
    flex: 1,
    justifyContent: 'space-between',
  },
  textBlock: {
    flex: 1,
    justifyContent: 'space-between',
  },
  badge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
    marginBottom: spacing.lg,
    width: '60%',
  },
  cta: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  ctaText: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  image: {
    width: 180,
    height: 180,
    position: 'absolute',
    right: 8,
    bottom: 6,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D5DCE6',
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 20,
  },
});

export default HeroCarousel;
