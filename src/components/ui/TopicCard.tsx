import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

export type TopicCardItem = {
  id: string;
  title: string;
  description: string;
  color: string;
  icon: any;
};

type TopicCardProps = {
  item: TopicCardItem;
  onPress?: () => void;
};

export const TopicCard = ({ item, onPress }: TopicCardProps) => {
  const { width } = useWindowDimensions();
  const isWideScreen = width >= 768;
  const titleMaxLines = isWideScreen ? 2 : 2;
  const descriptionMaxLines = isWideScreen ? 3 : 2;

  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}> 
      <Image source={item.icon} style={styles.icon} contentFit="contain" />
      <View style={styles.textWrap}>
        <Text style={styles.title} numberOfLines={titleMaxLines} ellipsizeMode="tail">
          {item.title}
        </Text>
        <Text style={styles.description} numberOfLines={descriptionMaxLines} ellipsizeMode="tail">
          {item.description}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '48%',
    maxWidth: 250,
    minWidth: 170,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    backgroundColor: colors.white,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  icon: {
    width: 70,
    height: 70,
    tintColor: colors.text,
    borderRadius: radius.sm,
  },
  textWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    marginLeft: spacing.sm,
    minWidth: 0,
  },
  title: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  description: {
    color: '#4B5563',
    fontSize: 10,
    lineHeight: 14,
  },
});
