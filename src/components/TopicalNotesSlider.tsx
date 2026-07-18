import { Image } from "expo-image";
import {
    FlatList,
    Pressable,
    StyleSheet,
    Text,
    View
} from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { topicalNotes, type TopicalNote } from "../constants/homeData";
import { colors, shadows, spacing } from "../constants/theme";

export const TopicalNotesSlider = () => {
  const data = [...topicalNotes, ...topicalNotes];

  return (
    <Animated.View entering={FadeInUp.duration(450)} style={styles.container}>
      <FlatList
        horizontal
        data={data}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => <NoteCard item={item} />}
        contentContainerStyle={styles.list}
      />
    </Animated.View>
  );
};

const NoteCard = ({ item }: { item: TopicalNote }) => (
  <Pressable style={styles.card} accessibilityRole="button">
    <View style={[styles.imageWrap, { backgroundColor: item.accent }]}>
      <Image source={item.image} style={styles.image} contentFit="contain" />
    </View>
    <Text style={styles.subject}>{item.subject}</Text>
    <Text style={styles.title}>{item.title}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  list: { paddingRight: spacing.md },
  card: {
    width: 138,
    marginRight: spacing.md,
    padding: spacing.md,
    borderRadius: 20,
    backgroundColor: colors.white,
    ...shadows.soft,
    alignItems: "center",
  },
  imageWrap: {
    width: 92,
    height: 92,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  image: { width: 70, height: 70 },
  subject: {
    color: colors.subtitle,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  title: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    marginTop: 4,
  },
});
