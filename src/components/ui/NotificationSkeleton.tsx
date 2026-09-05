import { memo, useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

export const NotificationSkeleton = memo(() => {
  const { colors } = useTheme();
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.35,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [pulse]);

  return (
    <View style={styles.wrapper}>
      {[0, 1, 2].map((index) => (
        <View
          key={index}
          style={[
            styles.card,
            {
              backgroundColor: colors.lightBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.avatar,
              { backgroundColor: colors.border, opacity: pulse },
            ]}
          />
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.line,
                styles.lineShort,
                { backgroundColor: colors.border, opacity: pulse },
              ]}
            />
            <Animated.View
              style={[
                styles.line,
                styles.lineLong,
                { backgroundColor: colors.border, opacity: pulse },
              ]}
            />
          </View>
          <Animated.View
            style={[
              styles.icon,
              { backgroundColor: colors.border, opacity: pulse },
            ]}
          />
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    marginTop: spacing.sm,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 64,
    borderRadius: 12,
    marginBottom: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#F5F5F5",
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E2E2E2",
    marginRight: 12,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 8,
  },
  line: {
    height: 12,
    borderRadius: 999,
    backgroundColor: "#E7E7E7",
    marginBottom: 6,
  },
  lineShort: {
    width: "48%",
  },
  lineLong: {
    width: "72%",
  },
  icon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#E7E7E7",
    marginLeft: 8,
  },
});
