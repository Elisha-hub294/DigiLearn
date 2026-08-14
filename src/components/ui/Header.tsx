import { Feather as Icon } from "@expo/vector-icons";
import { router } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import { useEffect, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { auth } from "../../../firebaseConfig";
import { colors, spacing } from "../../constants/theme";
import { useNotifications } from "../../hooks/useNotifications";

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
  const { width } = useWindowDimensions();
  const { hasUnread } = useNotifications();
  // Scale greeting font: 22px on ~320px screens, up to 34px on ~430px+ screens
  const greetingFontSize = Math.min(
    34,
    Math.max(22, Math.round(width * 0.075)),
  );
  const [userName, setUserName] = useState<string | null>(null);
  const [greeting, setGreeting] = useState("Hi there");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const firstName = getFirstName(user);
        setUserName(firstName);
      } else {
        setUserName(null);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    setGreeting(generateGreeting());
  }, []);

  const date = new Date().toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  const isLibraryVariant = Boolean(title);

  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        {isLibraryVariant ? (
          <Text style={[styles.libraryTitle, { fontSize: greetingFontSize }]}>
            {title}
          </Text>
        ) : (
          <>
            <Text style={styles.date}>{date}</Text>
            <Text style={[styles.greeting, { fontSize: greetingFontSize }]}>
              {greeting}
              {userName ? (
                <Text style={{ color: colors.primary }}> {userName}</Text>
              ) : null}
            </Text>
          </>
        )}
      </View>
      <View style={styles.actions}>
        <Pressable
          style={styles.notificationButton}
          accessibilityLabel="Open notifications"
          onPress={() => router.push("/notifications" as any)}
        >
          <Icon name={rightIconName as any} size={22} color={colors.text} />
          {showBadge && hasUnread ? <View style={styles.badge} /> : null}
        </Pressable>
      </View>
    </View>
  );
};

function getFirstName(user: User) {
  const name = user.displayName?.trim();
  if (!name) return null;
  return name.split(" ")[0];
}

function generateGreeting() {
  const now = new Date();
  const day = now.getDay();
  const hour = now.getHours();
  const isWeekend = day === 0 || day === 6;

  if (isWeekend) {
    if (hour < 12) return "Happy weekend";
    if (hour < 18) return "Enjoy your weekend";
    return "Happy weekend";
  }

  if (hour < 5) return "Working late";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good evening";
}

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
    fontWeight: "600",
    letterSpacing: -0.6,
  },
  libraryTitle: {
    color: colors.dark,
    fontWeight: "600",
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
