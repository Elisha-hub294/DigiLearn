import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

export type SubjectChipItem = {
  id: string;
  label: string;
  active?: boolean;
};

type SubjectChipProps = {
  item: SubjectChipItem;
  onPress?: () => void;
};

export const SubjectChip = ({ item, onPress }: SubjectChipProps) => (
  <Pressable accessibilityRole="button" onPress={onPress} style={[styles.chip, item.active ? styles.active : styles.inactive]}>
    <Text style={[styles.label, item.active ? styles.activeLabel : styles.inactiveLabel]}>{item.label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    marginRight: spacing.sm,
    marginTop: spacing.sm,
    borderWidth: 1,
  },
  active: {
    backgroundColor: colors.dark,
    borderColor: colors.dark,
  },
  inactive: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
  activeLabel: {
    color: colors.white,
  },
  inactiveLabel: {
    color: colors.text,
  },
});
