import { Image } from "expo-image";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, shadows, spacing } from "../../constants/theme";

const items = [
  {
    id: "math",
    title: "Math",
    image: require("../../../assets/images/math.png"),
  },
  {
    id: "physics",
    title: "Physics",
    image: require("../../../assets/images/physics.png"),
  },
  {
    id: "chemistry",
    title: "Chemistry",
    image: require("../../../assets/images/chemistry.png"),
  },
];

export const TopicalNotesSlider = () => {
  const data = [...items, ...items, ...items];

  return (
    <Animated.View entering={FadeInUp.duration(460)} style={styles.container}>
      <FlatList
        horizontal
        data={data}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            accessibilityRole="button"
            accessibilityLabel={item.title}
          >
            <View style={styles.imageWrap}>
              <Image
                source={item.image}
                style={styles.image}
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
  container: { marginBottom: spacing.xl },
  list: { paddingRight: spacing.md },
  card: {
    width: 128,
    marginRight: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: 22,
    backgroundColor: colors.white,
    ...shadows.soft,
    alignItems: "center",
  },
  imageWrap: {
    width: 84,
    height: 84,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
    backgroundColor: "#F3F4F6",
  },
  image: { width: 64, height: 64 },
  title: { color: colors.text, fontSize: 13, fontWeight: "700" },
});
