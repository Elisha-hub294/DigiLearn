import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";
import { Skeleton } from "./Skeleton";

export const NotificationSkeleton = memo(() => {
  const { colors } = useTheme();

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
          <Skeleton style={styles.avatar} />
          <View style={styles.content}>
            <Skeleton style={[styles.line, styles.lineShort]} />
            <Skeleton style={[styles.line, styles.lineLong]} />
          </View>
          <Skeleton style={styles.icon} />
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
