import { Image } from "expo-image";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, radius, shadows, spacing } from "../../constants/theme";

const items = [
  {
    id: "b1",
    title: "Mathematics for Senior",
    author: "K. Tendo",
    rating: "4.8",
    image: require("../../../assets/images/book1.jpg"),
  },
  {
    id: "b2",
    title: "Physics Study Guide",
    author: "A. Mwanga",
    rating: "4.7",
    image: require("../../../assets/images/book2.png"),
  },
  {
    id: "b3",
    title: "Chemistry Workbook",
    author: "J. Nakato",
    rating: "4.9",
    image: require("../../../assets/images/book3.jpeg"),
  },
];

export const BookCarousel = () => {
  const data = [...items, ...items, ...items];

  return (
    <Animated.View entering={FadeInUp.duration(680)} style={styles.container}>
      <FlatList
        horizontal
        data={data}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <Pressable style={styles.card} accessibilityRole="button">
            <Image
              source={item.image}
              style={styles.image}
              contentFit="cover"
            />
            <View style={styles.body}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.author}>{item.author}</Text>
              <View style={styles.row}>
                <Text style={styles.rating}>★ {item.rating}</Text>
                <View style={styles.buttonWrap}>
                  <Text style={styles.buttonText}>Open Library</Text>
                </View>
              </View>
            </View>
          </Pressable>
        )}
        contentContainerStyle={styles.list}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  list: { paddingRight: spacing.md, paddingVertical: spacing.lg },
  card: {
    width: 180,
    marginRight: spacing.md,
    backgroundColor: colors.white,
    borderRadius: 22,
    overflow: "hidden",
    ...shadows.card,
  },
  image: { width: "100%", height: 170 },
  body: { padding: spacing.md },
  title: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 4,
  },
  author: { color: colors.subtitle, fontSize: 12, marginBottom: spacing.sm },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rating: { color: colors.text, fontSize: 12, fontWeight: "700" },
  buttonWrap: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: "#EFF6FF",
  },
  buttonText: { color: colors.primary, fontSize: 10, fontWeight: "700" },
});
