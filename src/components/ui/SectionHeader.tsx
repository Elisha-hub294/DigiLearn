import { Pressable, StyleSheet, Text, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  actionLabel?: string;
}

export function SectionHeader({ title, subtitle, onSeeAll, actionLabel = 'See all' }: SectionHeaderProps) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {onSeeAll ? (
          <Pressable onPress={onSeeAll} hitSlop={10} style={styles.actionButton}>
            <Text style={styles.actionText}>{actionLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  textContainer: { flex: 1, paddingRight: 12 },
  title: { color: '#111', fontSize: 24, fontWeight: '800', letterSpacing: -0.6 },
  subtitle: { color: '#666', fontSize: 14, marginTop: 4, lineHeight: 20 },
  actionButton: { paddingVertical: 6, paddingHorizontal: 12, backgroundColor: '#F0F0F0', borderRadius: 16 },
  actionText: { color: '#111', fontSize: 13, fontWeight: '600' }
});
