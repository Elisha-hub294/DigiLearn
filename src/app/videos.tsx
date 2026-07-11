import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { FlashList } from '@shopify/flash-list';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, RefreshControl, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn } from 'react-native-reanimated';
import { LatestVideoCard } from '@/components/ui/LatestVideoCard';
import { SearchBar } from '@/components/ui/SearchBar';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SubjectFilter } from '@/components/ui/SubjectFilter';
import { TrendingCarousel } from '@/components/ui/TrendingCarousel';
import { VideoLesson } from '@/components/ui/TrendingVideoCard';
import { videoColors } from '@/components/ui/videoDesign';

const trending: VideoLesson[] = [
  { id: 'quadratic', title: 'Mastering Quadratic Equations | Complete Revision Lesson', teacher: 'Tr. Elisha', uploadedAt: '2 months ago', duration: '12:58', thumbnail: require('../../assets/images/thumb-1.jpeg'), avatar: require('../../assets/images/tr-1.webp') },
  { id: 'bonding', title: 'Understanding Chemical Bonding Made Easy', teacher: 'Tr. Sarah', uploadedAt: '3 weeks ago', duration: '08:45', thumbnail: require('../../assets/images/thumb-2.jpeg'), avatar: require('../../assets/images/tr-default.png'), isNew: true },
  { id: 'writing', title: 'Essay Writing Techniques for UNEB English', teacher: 'Tr. David', uploadedAt: '1 month ago', duration: '21:17', thumbnail: require('../../assets/images/thumb-3.jpg'), avatar: require('../../assets/images/tr-2.jpg') },
];
const latest: VideoLesson[] = [
  ...trending,
  { id: 'photosynthesis', title: 'Understanding Photosynthesis', teacher: 'Tr. Maria A.', uploadedAt: '6 days ago', duration: '14:20', thumbnail: require('../../assets/images/thumb-4.jpeg'), avatar: require('../../assets/images/tr-3.jpg'), isNew: true },
  { id: 'circuits', title: 'Electric Circuits Explained', teacher: 'Tr. Elisha Bagalwa', uploadedAt: '2 days ago', duration: '18:32', thumbnail: require('../../assets/images/thumb-5.jpeg'), avatar: require('../../assets/images/tr-1.webp'), isNew: true },
  { id: 'networks', title: 'Introduction to Computer Networks', teacher: 'Tr. Joshua', uploadedAt: '1 week ago', duration: '10:05', thumbnail: require('../../assets/images/thumb-1.jpeg'), avatar: require('../../assets/images/tr-default.png') },
];

export default function VideosScreen() {
  const { width } = useWindowDimensions();
  const [subject, setSubject] = useState('All');
  const [refreshing, setRefreshing] = useState(false);
  const isTablet = width >= 768;
  const horizontalPadding = isTablet ? 44 : width >= 390 ? 22 : 16;
  const contentWidth = Math.min(width - horizontalPadding * 2, 720);
  const cardWidth = Math.min(contentWidth * 0.9, 570);
  const onRefresh = useCallback(() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 650); }, []);
  const visibleLatest = useMemo(() => subject === 'All' ? latest : latest.filter((_, index) => index % 2 === 0), [subject]);
  const header = useMemo(() => <>
    <View style={styles.topRow}><Text style={styles.pageTitle}>Lessons</Text><Pressable accessibilityLabel="Notifications" accessibilityRole="button" hitSlop={10} style={styles.bell}><Ionicons name="notifications-outline" size={28} color={videoColors.ink} /><View style={styles.dot} /></Pressable></View>
    <SearchBar /><View style={styles.filter}><SubjectFilter selected={subject} onSelect={setSubject} /></View>
    <View style={styles.section}><SectionHeader title="Trending ⚡" /><TrendingCarousel items={trending} cardWidth={cardWidth} /></View>
    <View style={styles.latestHeading}><SectionHeader title="Latest" /></View>
  </>, [cardWidth, subject]);
  return <SafeAreaView edges={['top']} style={styles.safe}><Animated.View entering={FadeIn.duration(380)} style={[styles.container, { maxWidth: 808, paddingHorizontal: horizontalPadding }]}><FlashList data={visibleLatest} renderItem={({ item, index }) => <LatestVideoCard item={item} index={index} />} keyExtractor={(item) => item.id} ListHeaderComponent={header} ListFooterComponent={<Image source={require('../../assets/images/footer-vids.png')} contentFit="contain" style={styles.footerImage} accessibilityLabel="Learning together illustration" />} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={videoColors.primary} />} /></Animated.View></SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { backgroundColor: '#fff', flex: 1 }, container: { alignSelf: 'center', flex: 1, width: '100%' }, listContent: { paddingBottom: 104 }, topRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingTop: 8 }, pageTitle: { color: '#111', fontSize: 34, fontWeight: '800', letterSpacing: -1 }, bell: { padding: 4, position: 'relative' }, dot: { backgroundColor: '#FF3B30', borderColor: '#fff', borderRadius: 5, borderWidth: 1.5, height: 10, position: 'absolute', right: 3, top: 3, width: 10 }, filter: { marginTop: 18 }, section: { marginTop: 30 }, latestHeading: { marginTop: 34 }, footerImage: { alignSelf: 'center', height: 170, marginTop: 18, width: '88%' },
});
