import { spacing } from "@/constants/theme";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { loadSubjects } from "../../services/subjectsService";
import { FilterChip } from "./FilterChip";

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
  const { subjects: subjectList } = useSubjects(resourceItems);

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
});
