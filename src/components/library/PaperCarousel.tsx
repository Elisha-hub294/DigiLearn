import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { spacing } from "../../constants/theme";
import { PaperCard } from "./PaperCard";

type PaperItem = {
  id: string;
  title: string;
  subject: string;
  year: string;
  pages: string;
  image: any;
  document?: string;
};

type PaperCarouselProps = {
  items: PaperItem[];
};

export function PaperCarousel({ items }: PaperCarouselProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {items.map((item) => (
        <PaperCard
          key={item.id}
          title={item.title}
          subject={item.subject}
          year={item.year}
          pages={item.pages}
          image={item.image}
          document={item.document}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingRight: spacing.lg,
    paddingBottom: spacing.lg,
  },
});
