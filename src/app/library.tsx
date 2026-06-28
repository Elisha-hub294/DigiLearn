import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../constants/theme';

export default function LibraryScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>A modern library view is ready for future expansion.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.lightBackground, justifyContent: 'center', padding: spacing.xl },
  card: { backgroundColor: colors.white, borderRadius: 24, padding: spacing.xl },
  title: { ...typography.title, color: colors.text, marginBottom: spacing.sm },
  subtitle: { ...typography.subtitle, color: colors.subtitle },
});
