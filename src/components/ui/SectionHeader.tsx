import { StyleSheet, Text, View } from 'react-native';
export function SectionHeader({ title }: { title: string }) { return <View style={styles.wrap}><Text style={styles.title}>{title}</Text></View>; }
const styles = StyleSheet.create({ wrap: { marginBottom: 14 }, title: { color: '#111', fontSize: 28, fontWeight: '800', letterSpacing: -0.6 } });
