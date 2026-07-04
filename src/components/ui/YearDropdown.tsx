import { Feather as Icon } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';

type YearDropdownProps = {
  value: string;
};

export const YearDropdown = ({ value }: YearDropdownProps) => (
  <Pressable accessibilityRole="button" style={styles.container}>
    <Text style={styles.label}>{value}</Text>
    <Icon name="chevron-down" size={16} color={colors.subtitle} />
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 92,
    ...shadows.soft,
  },
  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
});
