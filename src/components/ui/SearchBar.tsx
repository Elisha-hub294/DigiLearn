import { Feather as Icon } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, shadows, spacing } from '../../constants/theme';

export const SearchBar = () => (
  <View style={styles.container}>
    <Icon name="search" size={18} color={colors.subtitle} />
    <TextInput placeholder="Search" placeholderTextColor={colors.subtitle} style={styles.input} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dadada',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...shadows.soft,
    marginBottom: spacing.xl,
  },
  input: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.text,
    fontSize: 15,
  },
});
