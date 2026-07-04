import { Feather as Icon } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MasonryCardData } from '../components/MasonryCard';
import MasonrySection from '../components/MasonrySection';
import { Header } from '../components/ui/Header';
import { HeroCarousel } from '../components/ui/HeroCarousel';
import { SearchBar } from '../components/ui/SearchBar';
import { SectionHeader } from '../components/ui/SectionHeader';
import { forYouData, pastPapersData, subjectsData, videosData } from '../constants/data';
import { colors, dimensions, radius, shadows, spacing } from '../constants/theme';
import LoadingScreen from './loading';

export default function HomeScreen() {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [showLoading, setShowLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowLoading(false), 1100);
    return () => clearTimeout(timer);
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 900);
  }, []);

  const duplicatedSubjects = useMemo(() => [...subjectsData, ...subjectsData, ...subjectsData], []);
  const duplicatedVideos = useMemo(() => [...videosData, ...videosData, ...videosData], []);

  if (showLoading) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <Header />
        <SearchBar />

        <Animated.View entering={FadeInUp.duration(400)}>
          <HeroCarousel />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(450)} style={styles.section}>
          {/* Masonry "For you" section */}
          <MasonrySection
            title="For you"
            subtitle="Personalised learning"
            data={((): MasonryCardData[] =>
              forYouData.map((f) => ({
                id: f.id,
                type: f.image ? 'mixed' : 'text',
                title: f.title,
                subtitle: f.subtitle,
                image: f.image ?? undefined,
                backgroundColor: f.color,
                height: f.duration ? 200 : undefined,
              }))
            )()}
            numColumns={2}
            gap={12}
            onCardPress={(item) => router.push('/library')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(500)} style={styles.section}>
          <SectionHeader title="Subjects" subtitle="Pick a topic" onSeeAll={() => router.push('/library')} />
          <FlatList
            horizontal
            data={duplicatedSubjects}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => <SubjectCard item={item} />}
            contentContainerStyle={[styles.horizontalList, { paddingLeft: dimensions.screenPaddingHorizontal - 8 }]}
            decelerationRate="fast"
            snapToAlignment="start"
            snapToInterval={96 + spacing.md}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(550)} style={styles.section}>
          <SectionHeader title="Learn by watching" subtitle="Short lessons to stay on track" onSeeAll={() => router.push('/videos')} />
          <FlatList
            horizontal
            data={duplicatedVideos}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, index) => `${item.id}-${index}`}
            renderItem={({ item }) => <VideoCard item={item} />}
            contentContainerStyle={[styles.horizontalList, { paddingLeft: dimensions.screenPaddingHorizontal - 8 }]}
            decelerationRate="fast"
            snapToAlignment="start"
            snapToInterval={220 + spacing.md}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(600)} style={styles.section}>
          <MasonrySection
            title="Past papers"
            subtitle="Practice the latest questions"
            data={pastPapersData.map((p) => ({
              id: p.id,
              type: 'image' as const,
              title: p.title,
              image: p.image,
              backgroundColor: p.accent,
              height:
                p.title.toLowerCase().includes('uneb')
                  ? 220
                  : p.title.toLowerCase().includes('mock')
                  ? 160
                  : p.title.toLowerCase().includes('mark')
                  ? 260
                  : 130,
            }))}
            numColumns={2}
            gap={12}
            onCardPress={(item) => router.push('/library')}
          />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(650)} style={styles.section}>
          <PromotionBanner />
        </Animated.View>

        <Animated.View entering={FadeInUp.duration(700)} style={styles.section}>
          <Image source={require('../../assets/images/footer.png')} style={styles.footerImage} contentFit="contain" />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ForYouCard = ({ item }: { item: any }) => (
  <View style={[styles.forYouCard, { backgroundColor: item.color }]}> 
    <View style={styles.forYouHeader}>
      <View style={{ flex: 1 }}>
        <Text style={styles.forYouTitle}>{item.title}</Text>
      </View>
      {item.duration ? <Text style={styles.duration}>{item.duration}</Text> : null}
    </View>
    {item.subtitle ? <Text style={styles.forYouSubtitle}>{item.subtitle}</Text> : null}
    {item.image ? <Image source={item.image} style={styles.forYouImage} contentFit="cover" /> : null}
    <View style={styles.forYouFooter}>
      <View style={styles.playButton}><Icon name="play" size={16} color={colors.white} /></View>
    </View>
  </View>
);

const SubjectCard = ({ item }: { item: any }) => (
  <View style={styles.subjectCard}>
    <Image source={item.image} style={styles.subjectImage} contentFit="cover" />
    <Text style={styles.subjectTitle}>{item.title}</Text>
  </View>
);

const VideoCard = ({ item }: { item: any }) => (
  <View style={styles.videoCard}>
    <Image source={item.image} style={styles.videoImage} contentFit="cover" />
    <View style={styles.videoPlayButton}><Icon name="play" size={18} color={colors.white} /></View>
    <Text style={styles.videoTitle}>{item.title}</Text>
    <Text style={styles.videoAuthor}>{item.author}</Text>
  </View>
);

const PastPaperCard = ({ item }: { item: any }) => (
  <View style={[styles.pastPaperCard, { backgroundColor: item.accent }]}> 
    <Image source={item.image} style={styles.paperImage} contentFit="cover" />
    <Text style={styles.paperTitle}>{item.title}</Text>
    <View style={styles.tagRow}>
      {item.tags.map((tag: string) => (
        <View key={tag} style={styles.tagPill}><Text style={styles.tagText}>{tag}</Text></View>
      ))}
    </View>
  </View>
);

const PromotionBanner = () => (
    <View style={[styles.banner, { backgroundColor: '#FBE7CD' }]}> 
    <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
      <Image source={require('../../assets/images/bookshop.png')} style={styles.bannerImage} contentFit="contain" />
    </View>
    <Text style={styles.bannerTitle}>Book Shop</Text>
    <Text style={styles.bannerSubtitle}>Access to curated books and revision resources for every subject.</Text>
    <Pressable style={styles.bookshopButton} android_ripple={{ color: 'rgba(0,0,0,0.08)' }}>
      <Text style={styles.bookshopButtonText}>Open Bookshop</Text>
    </Pressable>
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: dimensions.width < 400 ? 8 : 12,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    maxWidth: dimensions.maxContentWidth,
    alignSelf: 'center',
    width: '100%',
  },
  section: {
    marginBottom: spacing.xxl,
  },
  horizontalList: {
    paddingRight: spacing.md,
  },
  forYouCard: {
    width: wp('42%'),
    minHeight: 180,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginRight: spacing.md,
    ...shadows.card,
  },
  forYouHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  forYouTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: spacing.sm,
  },
  duration: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  forYouSubtitle: {
    color: colors.subtitle,
    marginTop: 8,
    fontSize: 12,
    marginBottom: spacing.sm,
  },
  forYouImage: {
    width: '100%',
    height: 58,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  forYouFooter: {
    marginTop: 'auto',
    alignItems: 'flex-end',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectCard: {
    width: 96,
    alignItems: 'center',
    marginRight: spacing.md,
  },
  subjectImage: {
    width: 84,
    height: 84,
    borderRadius: radius.xl,
    marginBottom: spacing.sm,
    backgroundColor: colors.lightBackground,
  },
  subjectTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  videoCard: {
    width: 220,
    marginRight: spacing.md,
    borderRadius: radius.xl,
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    ...shadows.card,
    overflow: 'hidden',
  },
  videoImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  videoPlayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 76,
    left: 16,
  },
  videoTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  videoAuthor: {
    color: colors.subtitle,
    fontSize: 12,
    paddingHorizontal: spacing.md,
    marginTop: 4,
  },
  grid: {
    gap: spacing.md,
  },
  pastPaperCard: {
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.soft,
  },
  paperImage: {
    width: '100%',
    height: 90,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
  },
  paperTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  tagText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  banner: {
    backgroundColor: '#FBE7CD',
    borderRadius: radius.xl,
    padding: spacing.md,
    ...shadows.card,
  },
  bannerImage: {
    width: '100%',
    height: 190,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  bannerTitle: {
    color: '#995926',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: colors.subtitle,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  bookshopButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#B0A562',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    ...shadows.soft,
  },
  bookshopButtonText: {
    color: colors.white,
    fontWeight: '700',
  },
  footerImage: {
    width: wp('88%'),
    height: 180,
    borderRadius: radius.xl,
  },
});