import { Image } from "expo-image";
import { useMemo } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, radius, spacing } from "../../constants/theme";

const SUPABASE_ICONS =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/Icons";

const items = [
  { id: "math", title: "Math", image: `${SUPABASE_ICONS}/math-3d.png` },
  { id: "physics", title: "Physics", image: `${SUPABASE_ICONS}/phys-3d.png` },
  {
    id: "chemistry",
    title: "Chemistry",
    image: `${SUPABASE_ICONS}/chem-3d.png`,
  },
  {
    id: "agriculture",
    title: "Agriculture",
    image: `${SUPABASE_ICONS}/agric-3d.png`,
  },
  { id: "biology", title: "Biology", image: `${SUPABASE_ICONS}/bio-3d.png` },
  {
    id: "english",
    title: "English",
    image: `${SUPABASE_ICONS}/eng-3d.png`,
  },
  {
    id: "history",
    title: "History",
    image: `${SUPABASE_ICONS}/hist-3d.png`,
  },
  {
    id: "geography",
    title: "Geography",
    image: `${SUPABASE_ICONS}/geo-3d.png`,
  },
  {
    id: "cre",
    title: "CRE",
    image: `${SUPABASE_ICONS}/cre-3d.png`,
  },
  {
    id: "kiswahili",
    title: "Kiswahili",
    image: `${SUPABASE_ICONS}/default-book-3d.png`,
  },
  {
    id: "entrepreneurship",
    title: "Entrepreneurship",
    image: `${SUPABASE_ICONS}/default-book-3d.png`,
  },
  {
    id: "ire",
    title: "IRE",
    image: `${SUPABASE_ICONS}/default-book-3d.png`,
  },
  {
    id: "art-design",
    title: "Art & Design",
    image: `${SUPABASE_ICONS}/default-book-3d.png`,
  },
  {
    id: "ict",
    title: "ICT",
    image: `${SUPABASE_ICONS}/default-book-3d.png`,
  },
  {
    id: "literature",
    title: "Literature",
    image: `${SUPABASE_ICONS}/default-book-3d.png`,
  },
  {
    id: "luganda",
    title: "Luganda",
    image: `${SUPABASE_ICONS}/default-book-3d.png`,
  },
  {
    id: "runyankole",
    title: "Runyankole",
    image: `${SUPABASE_ICONS}/default-book-3d.png`,
  },
  {
    id: "french",
    title: "French",
    image: `${SUPABASE_ICONS}/default-book-3d.png`,
  },
];

/** Fisher-Yates shuffle — runs once per app mount */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const TopicalNotesSlider = () => {
  const { width } = useWindowDimensions();
  const cardWidth = width >= 900 ? 128 : 110;

  // Shuffle once when the component mounts
  const data = useMemo(() => shuffle(items), []);

  return (
    <Animated.View entering={FadeInUp.duration(460)}>
      <FlatList
        horizontal
        data={data}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.card]}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: item.image }}
                style={[styles.image]}
                contentFit="contain"
              />
            </View>
            <Text style={styles.title}>{item.title}</Text>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  list: {
    marginBottom: spacing.xl,
  },
  card: {
    marginRight: spacing.lg,
    alignItems: "center",
  },
  imageWrap: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  image: { width: 94, height: 94, borderRadius: radius.sm },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "500",
  },
});
