import { Feather as Icon } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, shadows, spacing } from '../../constants/theme';

type SearchBarProps = {
  placeholder?: string;
};

export const SearchBar = ({ placeholder = 'Search by title, author, subject or teacher' }: SearchBarProps) => (
  <View style={styles.container}>
    <Icon name="search" size={18} color={colors.subtitle} />
    <TextInput
      accessibilityLabel="Search library"
      placeholder={placeholder}
      placeholderTextColor="#9A9A9A"
      style={styles.input}
      returnKeyType="search"
    />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F2F2',
    borderRadius: 14,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    ...shadows.soft,
    marginBottom: spacing.xl,
    height: 52,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
});
