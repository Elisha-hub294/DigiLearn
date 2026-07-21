import { Image } from "expo-image";
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
  const { width } = useWindowDimensions();
  const data = [...items, ...items, ...items];
  const cardWidth = width >= 900 ? 128 : 110;

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
                source={item.image}
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
    // borderRadius: 10,
    alignItems: "center",
    // borderBottomWidth: 1,
    // borderBottomColor: colors.border,
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
