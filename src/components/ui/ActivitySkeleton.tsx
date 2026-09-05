import React from "react";
import { StyleSheet, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";
import { Skeleton } from "./Skeleton";

export const ActivitySkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((key) => (
        <View
          key={key}
          style={[
            styles.cardSkeleton,
            { backgroundColor: colors.white, borderColor: colors.border },
          ]}
        >
          <Skeleton style={styles.leftPanelSkeleton} />
          <View style={styles.infoSkeleton}>
            <Skeleton style={styles.titleLine} />
            <Skeleton style={styles.descLine1} />
            <Skeleton style={styles.descLine2} />
            <Skeleton style={styles.dateLine} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  cardSkeleton: {
    width: "100%",
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    marginBottom: 10,
  },
  leftPanelSkeleton: {
    width: 80,
    height: "100%",
  },
  infoSkeleton: {
    flex: 1,
    paddingLeft: 10,
    paddingRight: 12,
    paddingTop: 10,
    paddingBottom: 8,
    justifyContent: "space-between",
  },
  titleLine: {
    width: "60%",
    height: 12,
    borderRadius: 4,
    marginBottom: 6,
  },
  descLine1: {
    width: "90%",
    height: 10,
    borderRadius: 3,
    marginBottom: 4,
  },
  descLine2: {
    width: "70%",
    height: 10,
    borderRadius: 3,
  },
  dateLine: {
    width: "30%",
    height: 8,
    borderRadius: 3,
    marginTop: 4,
  },
});

export default ActivitySkeleton;
