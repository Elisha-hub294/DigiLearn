import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
    useWindowDimensions,
} from "react-native";
import { colors, radius, spacing } from "../../constants/theme";
import { useProfile } from "../../contexts/ProfileContext";
import {
  matchesUserInterests,
  shouldFilterByInterests,
} from "../../utils/interestFilter";

type HeroBook = {
  id: string;
  title: string;
  author: string;
  subtitle: string;
  subject?: string;
  image: any;
  badge?: string;
};

type HeroBookCarouselProps = {
  data: HeroBook[];
};

export function HeroBookCarousel({ data }: HeroBookCarouselProps) {
  const { width } = useWindowDimensions();
  const { profile } = useProfile();
  const [activeIndex, setActiveIndex] = useState(0);

  const slides = useMemo(() => {
    const seen = new Set<string>();

    let list = data.filter((item) => {
      if (seen.has(item.id)) {
        return false;
      }

      seen.add(item.id);
      return true;
    });

    if (shouldFilterByInterests(profile)) {
      list = list.filter((item) =>
        matchesUserInterests(
          item.subject || item.subtitle || item.title,
          profile?.subjects,
        ),
      );
    }

    return list;
  }, [data, profile]);

  const itemWidth = Math.min(width * 0.78, 320);
  const gap = 14;
  const snapInterval = itemWidth + gap;
  const normalizedIndex = activeIndex % Math.max(slides.length, 1);

  if (slides.length === 0) return null;

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={snapInterval}
        snapToAlignment="center"
        contentContainerStyle={styles.carouselContent}
        onMomentumScrollEnd={(event) => {
          const offsetX = event.nativeEvent.contentOffset.x;
          const nextIndex = Math.round(offsetX / snapInterval);
          setActiveIndex(nextIndex);
        }}
      >
        {slides.map((item, index) => {
          const isActive = index === normalizedIndex;

          return (
            <Pressable
              key={`${item.id}-${index}`}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.title}`}
              onPress={() =>
                router.push({
                  pathname: "/book-preview",
                  params: {
                    id: item.id,
                    source: "library",
                    returnTo: "/library",
                  },
                } as any)
              }
              style={[styles.slideWrapper, { width: itemWidth }]}
            >
              <View
                style={[
                  styles.card,
                  isActive ? styles.activeCard : styles.inactiveCard,
                ]}
              >
                <Image
                  source={item.image}
                  style={styles.image}
                  contentFit="cover"
                />
                <LinearGradient
                  colors={[
                    "transparent",
                    "rgba(3, 7, 18, 0.35)",
                    "rgba(3, 7, 18, 0.85)",
                  ]}
                  locations={[0, 0.45, 1]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.overlay}
                />
                <View style={styles.content}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={styles.author}>{item.author}</Text>
                  {/* <Text style={styles.subtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text> */}
                </View>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.xl,
  },
  carouselContent: {
    paddingHorizontal: spacing.sm,
    paddingRight: spacing.lg,
    paddingVertical: spacing.lg,
  },
  slideWrapper: {
    marginHorizontal: spacing.xs,
  },
  card: {
    width: "100%",
    height: 300,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: colors.white,
  },
  inactiveCard: {
    transform: [{ scale: 0.96 }],
  },
  activeCard: {
    transform: [{ scale: 1 }],
  },
  image: {
    width: "100%",
    height: "100%",
    position: "absolute",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.sm,
    gap: 8,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  badgeText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  progressChip: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  progressText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: "700",
  },
  title: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  author: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  subtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    lineHeight: 18,
  },
});
