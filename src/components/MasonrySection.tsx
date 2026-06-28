import MasonryList from '@react-native-seoul/masonry-list';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { colors, spacing as themeSpacing, typography } from '../constants/theme';
import MasonryCard, { MasonryCardData } from './MasonryCard';

type Props = {
  title?: string;
  subtitle?: string;
  data: MasonryCardData[];
  numColumns?: number;
  gap?: number;
  onCardPress?: (item: MasonryCardData) => void;
};

const MasonrySection: React.FC<Props> = ({ title, subtitle, data, numColumns, gap = 12, onCardPress }) => {
  const keyExtractor = useCallback((item: MasonryCardData) => item.id, []);

  const { width } = useWindowDimensions();

  // Responsive columns if numColumns not provided
  const computedColumns = useMemo(() => {
    if (typeof numColumns === 'number') return numColumns;
    if (width >= 1000) return 4;
    if (width >= 800) return 3;
    if (width >= 600) return 2;
    return 2;
  }, [numColumns, width]);

  const renderItem = useCallback(
    ({ item, i }: any) => (
      <View style={{ padding: gap / 2 }}>
        <MasonryCard item={item as MasonryCardData} onPress={onCardPress} spacing={gap} />
      </View>
    ),
    [onCardPress, gap]
  );

  const content = useMemo(() => data, [data]);

  return (
    <View style={styles.section}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}

      <Animated.View entering={FadeIn}>
        <MasonryList
          data={content}
          keyExtractor={keyExtractor}
          numColumns={computedColumns}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: gap / 2 }}
          renderItem={renderItem}
          onEndReachedThreshold={0.5}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginBottom: themeSpacing.xl,
  },
  header: {
    marginBottom: themeSpacing.sm,
  },
  title: {
    ...typography.heading,
    color: colors.text,
    fontSize: 18,
    marginBottom: 4,
  },
  subtitle: {
    color: colors.subtitle,
    fontSize: 13,
  },
});

export default React.memo(MasonrySection);
