import { StyleSheet, View } from "react-native";
import { Skeleton } from "../ui/Skeleton";

export function SearchSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((key) => (
        <View key={key} style={styles.card}>
          <Skeleton style={styles.imageSkeleton} />
          <View style={styles.textSkeletonContainer}>
            <Skeleton style={styles.titleSkeleton} />
            <Skeleton style={styles.descSkeleton} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 8,
  },
  card: {
    height: 80,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 18,
  },
  imageSkeleton: {
    width: 80,
    height: 60,
    borderRadius: 8,
  },
  textSkeletonContainer: {
    flex: 1,
    gap: 8,
  },
  titleSkeleton: {
    width: "70%",
    height: 18,
    borderRadius: 4,
  },
  descSkeleton: {
    width: "90%",
    height: 14,
    borderRadius: 4,
  },
});
