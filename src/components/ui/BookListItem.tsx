import { Feather as Icon } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';

export type BookListItemData = {
  id: string;
  title: string;
  description: string;
  author: string;
  subject: string;
  image: any;
  bookmarked?: boolean;
};

type BookListItemProps = {
  item: BookListItemData;
  onPress?: () => void;
};

export const BookListItem = ({ item, onPress }: BookListItemProps) => (
  <View style={styles.row}>
    <Image source={item.image} style={styles.cover} contentFit="cover" />
    <View style={styles.content}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.description}>{item.description}</Text>
        </View>
        <Pressable accessibilityLabel={`Bookmark ${item.title}`} style={styles.iconButton}>
          <Icon name={item.bookmarked ? 'bookmark' : 'bookmark'} size={16} color={item.bookmarked ? colors.primary : colors.subtitle} />
        </Pressable>
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.author}>{item.author}</Text>
        <View style={styles.subjectBadge}><Text style={styles.subjectText}>{item.subject}</Text></View>
      </View>
      <Pressable accessibilityRole="button" onPress={onPress} style={styles.button}>
        <Text style={styles.buttonText}>Details</Text>
      </Pressable>
    </View>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  cover: {
    width: 90,
    height: 130,
    borderRadius: radius.lg,
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
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
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.lightBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  author: {
    color: colors.subtitle,
    fontSize: 12,
  },
  subjectBadge: {
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
  },
  subjectText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  button: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  buttonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
});
