import { spacing } from "@/constants/theme";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { loadSubjects } from "../../services/subjectsService";
import { FilterChip } from "./FilterChip";
import { Skeleton } from "./Skeleton";

type ResourceItem = {
  subject?: string | string[];
};

export function useSubjects(resourceItems: ResourceItem[] = []) {
  const [subjectList, setSubjectList] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void loadSubjects()
      .then((subjects) => {
        if (!active) return;
        const withoutAll = subjects
          .map((subject) => subject.name)
          .filter((name) => name.toLowerCase() !== "all");
        setSubjectList(["All", ...withoutAll]);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error loading subjects:", error);
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const subjects = [...subjectList].sort((left, right) => {
    if (left === "All") {
      return -1;
    }
    if (right === "All") {
      return 1;
    }

    const countResources = (subject: string) =>
      resourceItems.filter((item) => {
        const itemSubjects = (
          Array.isArray(item.subject) ? item.subject : [item.subject]
        ).flatMap((itemSubject) =>
          typeof itemSubject === "string" ? itemSubject.split(",") : [],
        );
        return itemSubjects.some(
          (itemSubject) =>
            typeof itemSubject === "string" &&
            itemSubject.trim().toLowerCase() === subject.toLowerCase(),
        );
      }).length;

    return countResources(right) - countResources(left);
  });

  return { subjects, loading };
}

export function SubjectFilter({
  selected,
  onSelect,
  resourceItems,
}: {
  selected: string;
  onSelect: (subject: string) => void;
  resourceItems?: ResourceItem[];
}) {
  const { subjects: subjectList, loading } = useSubjects(resourceItems);

  if (loading) {
    return (
      <View style={styles.wrap} accessibilityLabel="Loading subjects">
        <View style={styles.skeletonContent}>
          {[72, 96, 84, 112].map((width, index) => (
            <Skeleton key={index} style={[styles.skeletonChip, { width }]} />
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <FlatList
        data={subjectList}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item, index) => `${item}-${index}`}
        renderItem={({ item }) => (
          <FilterChip
            label={item}
            selected={item === selected}
            onPress={() => onSelect(item)}
          />
        )}
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%" },
  content: { paddingRight: spacing.md },
  skeletonContent: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  skeletonChip: { height: 34, borderRadius: 17 },
});
