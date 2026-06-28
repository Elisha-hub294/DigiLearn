import { Feather as Icon } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useCallback } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { colors, shadows, spacing, typography } from '../constants/theme';

export type MasonryCardData = {
  id: string;
  type: 'image' | 'text' | 'action' | 'mixed';
  title?: string;
  subtitle?: string;
  image?: any;
  buttons?: { id: string; title: string; color?: string }[];
  backgroundColor?: string;
  height?: number;
};

type Props = {
  item: MasonryCardData;
  onPress?: (item: MasonryCardData) => void;
  spacing?: number;
};

const MasonryCard: React.FC<Props> = ({ item, onPress, spacing = 12 }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.985, { duration: 120 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 180 });
  }, [scale]);

  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return (
          <>
            {item.image ? (
              <Image source={item.image} style={styles.image} contentFit="cover" />
            ) : null}
            <View style={styles.overlayTop} pointerEvents="none">
              {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
              {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
            </View>
          </>
        );

      case 'text':
        return (
          <View style={styles.textWrap}>
            <Text style={styles.largeTitle}>{item.title}</Text>
            {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
          </View>
        );

      case 'action':
        return (
          <View style={styles.actionWrap}>
            <Text style={styles.largeTitle}>{item.title}</Text>
            <View style={styles.buttonsRow}>
              {item.buttons?.map((b) => (
                <Pressable key={b.id} style={[styles.actionButton, { backgroundColor: b.color ?? colors.primary }]}> 
                  <Text style={styles.actionButtonText}>{b.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        );

      default:
        return (
          <View style={styles.mixedWrap}>
            {item.image ? <Image source={item.image} style={styles.smallImage} contentFit="cover" /> : null}
            <View style={{ flex: 1, marginLeft: 12 }}>
              {item.title ? <Text style={styles.title}>{item.title}</Text> : null}
              {item.subtitle ? <Text style={styles.subtitle}>{item.subtitle}</Text> : null}
              <View style={styles.rowBottom}>
                <Icon name="book" size={14} color={colors.subtitle} />
                <Text style={styles.smallMeta}>  Learn</Text>
              </View>
            </View>
          </View>
        );
    }
  };

  return (
    <Animated.View style={[styles.container, { backgroundColor: item.backgroundColor ?? colors.white, height: item.height ?? undefined }, animatedStyle]}>
      <Pressable onPress={() => onPress?.(item)} onPressIn={handlePressIn} onPressOut={handlePressOut} style={[styles.pressable, { padding: spacing }]}>
        {renderContent()}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    ...shadows.card,
  },
  pressable: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: spacing.sm,
  },
  overlayTop: {
    position: 'absolute',
    left: 12,
    top: 12,
  },
  title: {
    ...typography.heading,
    color: colors.white,
    fontSize: 16,
  },
  largeTitle: {
    ...typography.heading,
    color: colors.text,
    fontSize: 16,
  },
  subtitle: {
    color: colors.subtitle,
    marginTop: 6,
    fontSize: 13,
  },
  textWrap: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    minHeight: 100,
  },
  actionWrap: {
    minHeight: 120,
    justifyContent: 'space-between',
  },
  buttonsRow: {
    flexDirection: 'row',
    marginTop: spacing.sm,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    ...shadows.soft,
  },
  actionButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  mixedWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  rowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  smallMeta: {
    color: colors.subtitle,
    fontSize: 12,
  },
});

export default React.memo(MasonryCard);
