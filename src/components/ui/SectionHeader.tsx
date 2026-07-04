import { Feather as Icon } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  actionLabel?: string;
  actionIcon?: React.ComponentProps<typeof Icon>['name'];
};

export const SectionHeader = ({ title, subtitle, onSeeAll, actionLabel, actionIcon = 'chevron-right' }: SectionHeaderProps) => (
  <View style={styles.row}>
    <View style={styles.titleWrap}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
    {onSeeAll ? (
      <Pressable accessibilityRole="button" onPress={onSeeAll} style={styles.button}>
        {actionLabel ? <Text style={styles.buttonText}>{actionLabel}</Text> : null}
        <Icon name={actionIcon} size={16} color={colors.primary} />
      </Pressable>
    ) : null}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  titleWrap: {
    flex: 1,
    paddingRight: spacing.sm,
  },
  title: {
    ...typography.heading,
    color: '#1E1E1E',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.body,
    color: colors.subtitle,
    marginTop: 4,
    lineHeight: 18,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.primaryLight,
  },
  buttonText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
    marginRight: 2,
  },
});
