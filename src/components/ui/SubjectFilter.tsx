import { FlatList, StyleSheet, View } from 'react-native';
import { FilterChip } from './FilterChip';

const subjects = ['All', 'Mathematics', 'Physics', 'Biology', 'Chemistry', 'English', 'Geography', 'History', 'ICT', 'Economics'];
export function SubjectFilter({ selected, onSelect }: { selected: string; onSelect: (subject: string) => void }) {
  const data = [...subjects, ...subjects];
  return <View style={styles.wrap}><FlatList data={data} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item, index) => `${item}-${index}`} renderItem={({ item }) => <FilterChip label={item} selected={item === selected} onPress={() => onSelect(item)} />} contentContainerStyle={styles.content} /></View>;
}
const styles = StyleSheet.create({ wrap: { marginRight: -24 }, content: { paddingRight: 36 } });
