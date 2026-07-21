import { useMemo } from "react";
import { FlatList, StyleSheet, View, useWindowDimensions } from "react-native";
import { dimensions, spacing } from "../../constants/theme";
import { TopicCard, TopicCardItem } from "./TopicCard";

type ReadAboutGridProps = {
  data: TopicCardItem[];
};

export const ReadAboutGrid = ({ data }: ReadAboutGridProps) => {
  const { width } = useWindowDimensions();

  const pages = useMemo(() => {
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    const grouped: TopicCardItem[][] = [];
    for (let index = 0; index < shuffled.length; index += 6) {
      grouped.push(shuffled.slice(index, index + 6));
    }
    return grouped;
  }, [data]);

  return (
    <View style={styles.container}>
      <View style={styles.overlay} />
      <FlatList
        data={pages}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        keyExtractor={(_, index) => `page-${index}`}
        renderItem={({ item }) => (
          <View
            style={[
              styles.page,
              {
                width: Math.min(
                  width - dimensions.screenPaddingHorizontal * 2,
                  420,
                ),
              },
            ]}
          >
            <View style={styles.grid}>
              {item.map((topic) => (
                <TopicCard key={topic.id} item={topic} />
              ))}
            </View>
          </View>
        )}
        contentContainerStyle={styles.listContent}
        decelerationRate="fast"
        snapToAlignment="start"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },
  backgroundImage: {
    ...StyleSheet.absoluteFill,
    borderRadius: 18,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 18,
  },
  listContent: {
    paddingRight: spacing.lg,
    position: "relative",
    zIndex: 1,
  },
  page: {
    paddingRight: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
});
