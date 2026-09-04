import { Feather as Icon } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { radius, spacing } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

type PrimaryButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Icon>['name'];
  fullWidth?: boolean;
  variant?: 'primary' | 'secondary';
};

export const PrimaryButton = ({ title, onPress, icon = 'arrow-right', fullWidth = false, variant = 'primary' }: PrimaryButtonProps) => {
  const { colors } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.button, fullWidth && styles.fullWidth, { backgroundColor: variant === 'secondary' ? colors.dark : colors.primary }]}>
      <Text style={[styles.text, { color: colors.white }]}>{title}</Text>
      <Icon name={icon} size={16} color={colors.white} />
    </Pressable>
  );
};

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
  fullWidth: {
    alignSelf: 'stretch',
  },
  text: {
    fontWeight: '700',
    fontSize: 14,
  },
});
