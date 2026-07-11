import { StyleSheet, Text, View } from 'react-native';

export function DurationBadge({ duration }: { duration: string }) {
  return <View style={styles.badge}><Text style={styles.text}>{duration}</Text></View>;
}

const styles = StyleSheet.create({
  badge: { backgroundColor: 'rgba(0,0,0,0.88)', borderRadius: 7, paddingHorizontal: 8, paddingVertical: 4 },
  text: { color: '#fff', fontSize: 12, fontWeight: '700', fontVariant: ['tabular-nums'] },
});
