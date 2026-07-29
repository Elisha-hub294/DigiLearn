import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { spacing } from "../../constants/theme";
import { CategoryCard } from "./CategoryCard";

type CategoryItem = {
  id: string;
  label: string;
  icon: any;
};

type CategorySliderProps = {
  items: CategoryItem[];
};

export function CategorySlider({ items }: CategorySliderProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {items.map((item) => (
        <View key={item.id}>
          <CategoryCard item={item} />
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingRight: spacing.lg,
    paddingBottom: spacing.xs,
  },
});
