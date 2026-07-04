import { Feather as Icon } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

type PrimaryButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Icon>['name'];
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary';
};

export const PrimaryButton = ({ title, onPress, icon = 'arrow-right', fullWidth = false, variant = 'primary' }: PrimaryButtonProps) => (
  <Pressable onPress={onPress} style={[styles.button, fullWidth && styles.fullWidth, variant === 'secondary' ? styles.secondary : styles.primary]}>
    <Text style={styles.text}>{title}</Text>
    <Icon name={icon} size={16} color={colors.white} />
  </Pressable>
);

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
  },
  primary: {
    backgroundColor: colors.primary,
  },
  secondary: {
    backgroundColor: colors.dark,
  },
  fullWidth: {
    alignSelf: 'stretch',
  },
  text: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 14,
  },
});
