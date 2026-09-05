import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

export const ActivitySkeleton: React.FC = () => {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 0.8,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [animatedValue]);

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
          <Animated.View
            style={[
              styles.leftPanelSkeleton,
              { backgroundColor: colors.border, opacity: animatedValue },
            ]}
          />
          <View style={styles.infoSkeleton}>
            <Animated.View
              style={[
                styles.titleLine,
                { backgroundColor: colors.border, opacity: animatedValue },
              ]}
            />
            <Animated.View
              style={[
                styles.descLine1,
                {
                  backgroundColor: colors.lightBackground,
                  opacity: animatedValue,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.descLine2,
                {
                  backgroundColor: colors.lightBackground,
                  opacity: animatedValue,
                },
              ]}
            />
            <Animated.View
              style={[
                styles.dateLine,
                { backgroundColor: colors.border, opacity: animatedValue },
              ]}
            />
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
