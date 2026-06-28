import { Pressable, StyleSheet, Text } from 'react-native';
import { Feather as Icon } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../constants/theme';

type PrimaryButtonProps = {
  title: string;
  onPress?: () => void;
  icon?: React.ComponentProps<typeof Icon>['name'];
  fullWidth?: boolean;
};

export const PrimaryButton = ({ title, onPress, icon = 'arrow-right', fullWidth = false }: PrimaryButtonProps) => (
  <Pressable onPress={onPress} style={[styles.button, fullWidth && styles.fullWidth]}>
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
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    alignSelf: 'flex-start',
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
