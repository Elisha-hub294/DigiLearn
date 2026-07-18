import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { carouselData } from "../constants/data";
import { dimensions, spacing } from "../constants/theme";
import { HeroCard } from "./HeroCard";

export const HeroCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const width = Math.min(dimensions.width * 0.9, 760);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % carouselData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Animated.View entering={FadeInUp.duration(400)} style={styles.container}>
      <FlatList
        data={carouselData}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(event.nativeEvent.contentOffset.x / width);
          setActiveIndex(index);
        }}
        renderItem={({ item }) => <HeroCard item={item} width={width} />}
        contentContainerStyle={{ paddingHorizontal: 4 }}
      />
      <View style={styles.dots}>
        {carouselData.map((_, index) => (
          <View
            key={index}
            style={[styles.dot, index === activeIndex && styles.dotActive]}
          />
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: spacing.xl },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: spacing.md,
    gap: 8,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#D5DCE6" },
  dotActive: { width: 24, backgroundColor: "#3B82F6" },
});
