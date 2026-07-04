import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { colors, radius, shadows, spacing } from '../../constants/theme';

export type BookItem = {
  id: string;
  title: string;
  description: string;
  author: string;
  rating: string;
  subject: string;
  image: any;
  badge?: string;
};

type BookCardProps = {
  item: BookItem;
  index: number;
  scrollX: any;
};

export const BookCard = ({ item, index, scrollX }: BookCardProps) => {
  const animatedStyle = useAnimatedStyle(() => {
    const offset = scrollX.value - index * 240;
    const distance = Math.abs(offset);
    const scale = distance < 240 ? Math.max(0.94, 1 - distance / 1200) : 0.94;
    return {
      transform: [{ scale: withSpring(scale, { damping: 18, stiffness: 120 }) }],
    };
  });

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      <Pressable accessibilityRole="button" style={styles.pressable}>
        <Image source={item.image} style={styles.image} contentFit="cover" contentPosition={'top left'} />
        <View style={styles.content}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
          <Text style={styles.author}>{item.author}</Text>
          <View style={styles.metaRow}>
            <View style={styles.ratingWrap}>
              <Text style={styles.rating}>{item.rating}</Text>
            </View>
            <View style={styles.badge}><Text style={styles.badgeText}>{item.subject}</Text></View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 220,
    marginRight: spacing.md,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    overflow: 'hidden',
    ...shadows.card,
  },
  pressable: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: colors.subtitle,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  author: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingWrap: {
    backgroundColor: '#FFF6D7',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  rating: {
    color: '#B17A00',
    fontSize: 12,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
});
