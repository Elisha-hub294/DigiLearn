import { FlatList, StyleSheet, View } from 'react-native';
import { TrendingVideoCard, VideoLesson } from './TrendingVideoCard';
export function TrendingCarousel({ items, cardWidth }: { items: VideoLesson[]; cardWidth: number }) { const data = [...items, ...items]; return <View style={styles.wrap}><FlatList data={data} horizontal showsHorizontalScrollIndicator={false} keyExtractor={(item, index) => `${item.id}-${index}`} renderItem={({ item }) => <TrendingVideoCard item={item} width={cardWidth} />} contentContainerStyle={styles.content} decelerationRate="fast" snapToInterval={cardWidth + 14} snapToAlignment="start" /></View>; }
const styles = StyleSheet.create({ wrap: { marginRight: -24 }, content: { paddingRight: 30 } });
