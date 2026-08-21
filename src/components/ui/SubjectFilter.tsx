import { spacing } from "@/constants/theme";
import { collection, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { db } from "../../../firebaseConfig";
import { FilterChip } from "./FilterChip";

export function useSubjects() {
  const [subjectList, setSubjectList] = useState<string[]>(["All"]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "subject"),
      (snapshot) => {
        const fetchedNames = snapshot.docs
          .map((doc) => doc.data()?.name)
          .filter(
            (name): name is string =>
              typeof name === "string" && name.trim().length > 0
          );

        if (fetchedNames.length > 0) {
          const uniqueNames: string[] = [];
          fetchedNames.forEach((name) => {
            const trimmed = name.trim();
            if (
              !uniqueNames.some(
                (item) => item.toLowerCase() === trimmed.toLowerCase()
              )
            ) {
              uniqueNames.push(trimmed);
            }
          });
          const withoutAll = uniqueNames.filter(
            (n) => n.toLowerCase() !== "all"
          );
          setSubjectList(["All", ...withoutAll]);
        }
        setLoading(false);
      },
      (error) => {
        console.error(
          "Error fetching subjects from Firestore collection 'subject':",
          error
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { subjects: subjectList, loading };
}

export function SubjectFilter({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (subject: string) => void;
}) {
  const { subjects: subjectList } = useSubjects();

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

