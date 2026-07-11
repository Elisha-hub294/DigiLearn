import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, TextInput, View } from 'react-native';
import { videoColors, videoRadii, videoShadows } from './videoDesign';

export function SearchBar() {
  return <View style={styles.container} accessibilityRole="search">
    <Ionicons name="search" size={21} color={videoColors.subtle} />
    <TextInput accessibilityLabel="Search lessons" placeholder="Search by title, subject or teacher" placeholderTextColor={videoColors.subtle} style={styles.input} returnKeyType="search" />
  </View>;
}

const styles = StyleSheet.create({
  container: { ...videoShadows.soft, alignItems: 'center', backgroundColor: videoColors.surface, borderRadius: videoRadii.search, flexDirection: 'row', height: 52, paddingHorizontal: 16 },
  input: { color: videoColors.ink, flex: 1, fontSize: 15, marginLeft: 10, paddingVertical: 0 },
});
