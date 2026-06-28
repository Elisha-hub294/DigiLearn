import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming
} from 'react-native-reanimated';
import { carouselData, CarouselItem } from '../../constants/data';
import { colors, dimensions, radius, shadows, spacing, typography } from '../../constants/theme';

const CARD_WIDTH_RATIO = 0.86;
const CARD_SPACING = 16;
const AUTOPLAY_INTERVAL = 5200;

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList as any);

export const HeroCarousel = () => {
  const slides = useMemo(() => carouselData, []);
  const { width } = useWindowDimensions();
  const containerPadding = Math.max(16, dimensions.screenPaddingHorizontal);
  const cardWidth = Math.min(width * CARD_WIDTH_RATIO, width - containerPadding * 2 - CARD_SPACING, 920);
  const snapInterval = cardWidth + CARD_SPACING;
  const sidePadding = Math.max(containerPadding, (width - cardWidth) / 2);

  const scrollX = useSharedValue(0);
  const flatRef = useRef<FlatList<CarouselItem>>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  // Auto-play
  useEffect(() => {
    let timer: any;
    if (!isInteracting) {
      timer = setInterval(() => {
        const next = (currentIndex + 1) % slides.length;
        flatRef.current?.scrollToOffset({ offset: next * snapInterval, animated: true });
        setCurrentIndex(next);
      }, AUTOPLAY_INTERVAL);
    }
    return () => clearInterval(timer);
  }, [isInteracting, currentIndex, slides.length, snapInterval]);

  const handleScrollEnd = (e: any) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const idx = Math.round(offsetX / snapInterval);
    setCurrentIndex(idx);
  };

  return (
    <View style={[styles.container, { paddingHorizontal: containerPadding }]}> 
      <AnimatedFlatList
        ref={flatRef}
        data={slides}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item: CarouselItem) => item.id}
        snapToInterval={snapInterval}
        decelerationRate="fast"
        bounces={false}
        onScroll={onScroll}
        onMomentumScrollEnd={handleScrollEnd}
        onScrollBeginDrag={() => setIsInteracting(true)}
        onScrollEndDrag={() => setIsInteracting(false)}
        contentContainerStyle={{ paddingLeft: sidePadding, paddingRight: sidePadding }}
        renderItem={({ item, index }: { item: CarouselItem; index: number }) => (
          <CarouselCard item={item} index={index} cardWidth={cardWidth} scrollX={scrollX} snapInterval={snapInterval} />
        )}
      />

      <View style={styles.dots}>
        {slides.map((_, i) => (
          <AnimatedDot key={i} index={i} currentIndex={currentIndex} />
        ))}
      </View>
    </View>
  );
};

const CarouselCard = ({ item, index, cardWidth, scrollX, snapInterval }: { item: CarouselItem; index: number; cardWidth: number; scrollX: any; snapInterval: number }) => {
  const inputRange = [(index - 1) * snapInterval, index * snapInterval, (index + 1) * snapInterval];
  const pressScale = useSharedValue(1);

  const style = useAnimatedStyle(() => {
    const scrollScale = interpolate(scrollX.value, inputRange, [0.95, 1, 0.95], Extrapolate.CLAMP);
    const scale = scrollScale * pressScale.value;
    const translateY = interpolate(scrollX.value, inputRange, [8, 0, 8], Extrapolate.CLAMP);
    return { transform: [{ scale }, { translateY }] };
  });

  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: withSequence(withTiming(-6, { duration: 1400 }), withTiming(0, { duration: 1400 })) }] }));

  const handlePressIn = () => {
    pressScale.value = withTiming(0.96, { duration: 100 });
  };

  const handlePressOut = () => {
    pressScale.value = withSequence(withTiming(1.04, { duration: 120 }), withTiming(1, { duration: 150 }));
  };

  return (
    <Animated.View style={[styles.card, { width: cardWidth, backgroundColor: item.color, marginRight: CARD_SPACING }, style]}>
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        android_ripple={{ color: 'rgba(0,0,0,0.06)' }}
        style={styles.cardInner}
      >
        <View style={styles.left}>
          <Text style={[styles.title, { color: item.titleColor ?? colors.text }]} accessibilityRole="header">
            {item.title}
          </Text>
          {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
          <Pressable android_ripple={{ color: 'rgba(0,0,0,0.06)' }} style={styles.ctaButton} accessibilityLabel={item.cta}>
            <Text style={[styles.ctaText, { color: item.titleColor ?? colors.primary }]}>{item.cta}</Text>
          </Pressable>
        </View>

        <View style={styles.right} pointerEvents="none">
          <Animated.Image source={item.image} style={[styles.image, floatStyle as any]} />
        </View>
      </Pressable>
    </Animated.View>
  );
};

const AnimatedDot = ({ index, currentIndex }: { index: number; currentIndex: number }) => {
  const active = currentIndex === index;
  const anim = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    anim.value = withTiming(active ? 1 : 0, { duration: 300 });
  }, [active]);
  const style = useAnimatedStyle(() => ({ width: 8 + anim.value * 12, backgroundColor: anim.value ? colors.primary : '#D5DCE6' }));
  return <Animated.View style={[styles.dot, style]} />;
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  card: {
    marginVertical: 4,
    borderRadius: 22,
    padding: spacing.lg,
    ...shadows.card,
    overflow: 'hidden',
  },
  cardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    flex: 0.55,
    paddingRight: spacing.md,
  },
  right: {
    flex: 0.45,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    ...typography.title,
    fontSize: 20,
    lineHeight: 26,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.subtitle,
    color: colors.subtitle,
    marginBottom: spacing.md,
  },
  ctaButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    ...shadows.soft,
  },
  ctaText: {
    fontWeight: '700',
  },
  image: {
    width: '100%',
    height: 140,
    resizeMode: 'contain',
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.md,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
});

export default HeroCarousel;
