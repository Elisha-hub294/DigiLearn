import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, shadows, spacing } from '../../constants/theme';

export type TeacherItem = {
  id: string;
  name: string;
  subject: string;
  school: string;
  image: any;
  verified?: boolean;
};

type TeacherCardProps = {
  item: TeacherItem;
  onPress?: () => void;
};

export const TeacherCard = ({ item, onPress }: TeacherCardProps) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={styles.card}>
    <View style={styles.avatarWrap}>
      <Image source={item.image} style={styles.avatar} contentFit="cover" />
      {item.verified ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>✓</Text>
        </View>
      ) : null}
    </View>
    <Text style={styles.name}>{item.name}</Text>
    <Text style={styles.subject}>{item.subject}</Text>
    <Text style={styles.school}>{item.school}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    width: 120,
    alignItems: 'center',
    marginRight: spacing.md,
    paddingVertical: spacing.sm,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    ...shadows.soft,
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  badgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '700',
  },
  name: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  subject: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 3,
  },
  school: {
    color: colors.subtitle,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 2,
  },
});
