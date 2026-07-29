import { Feather as Icon } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors, spacing } from "../../constants/theme";

type HeaderProps = {
  title?: string;
  rightIconName?: string;
  showBadge?: boolean;
};

export const Header = ({
  title,
  rightIconName = "bell",
  showBadge = true,
}: HeaderProps) => {
  const date = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  const isLibraryVariant = Boolean(title);

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        {isLibraryVariant ? (
          <Text style={styles.libraryTitle}>{title}</Text>
        ) : (
          <>
            <Text style={styles.date}>{date}</Text>
            <Text style={styles.greeting}>
              Hi, <Text style={{ color: colors.primary }}>Elisha</Text>
            </Text>
          </>
        )}
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.notificationButton}
          accessibilityLabel="Open actions"
        >
          <Icon name={rightIconName as any} size={22} color={colors.text} />
          {showBadge ? <View style={styles.badge} /> : null}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  textWrap: { flex: 1, paddingRight: spacing.md },
  date: {
    color: colors.subtitle,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 4,
  },
  greeting: {
    color: colors.dark,
    fontSize: 30,
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  libraryTitle: {
    color: colors.dark,
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.white,
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 8,
    right: 10,
    width: 11,
    height: 11,
    borderRadius: 4.5,
    backgroundColor: "#ff0000",
    borderWidth: 2,
    borderColor: colors.white,
  },
});
