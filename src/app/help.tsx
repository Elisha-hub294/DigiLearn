import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback } from "react";
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

type HelpSectionProps = { title: string; items: string[] };

function HelpItem({ title, onPress }: { title: string; onPress?: () => void }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.itemText, { color: colors.text }]}>{title}</Text>
      <Feather name="chevron-right" size={20} color={colors.text} />
    </Pressable>
  );
}

function HelpSection({ title, items }: HelpSectionProps) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.dark }]}>{title}</Text>
      <View style={styles.items}>
        {items.map((item) => (
          <HelpItem key={item} title={item} />
        ))}
      </View>
    </View>
  );
}

export default function HelpScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const maxWidth = Math.min(1100, width - horizontalPadding * 2);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.replace("/settings" as never);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
        const actionType = e.data?.action?.type;
        if (actionType === "GO_BACK" || actionType === "POP") {
          e.preventDefault();
          router.replace("/settings" as never);
        }
      });

      return () => {
        subscription.remove();
        unsubscribe();
      };
    }, [navigation, router]),
  );
  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: themeColors.background }]}
      edges={["top", "bottom"]}
    >
      <View style={styles.page}>
        <View style={[styles.contentContainer, { maxWidth }]}>
          <View
            style={[styles.headerRow, { paddingHorizontal: horizontalPadding }]}
          >
            <Pressable
              onPress={() => router.replace("/settings" as never)}
              style={styles.backButton}
              accessibilityLabel="Back to Settings"
            >
              <Feather name="arrow-left" size={22} color={colors.dark} />
            </Pressable>
            <Text style={[styles.title, { color: themeColors.dark }]}>
              How can we help?
            </Text>
          </View>
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { paddingHorizontal: horizontalPadding },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <HelpSection
              title="Frequently asked questions"
              items={[
                "Downloading files",
                "Offline file access",
                "Report a problem",
              ]}
            />
            <HelpSection
              title="Account"
              items={["Email", "Academic level", "Changing my subjects"]}
            />
            <HelpSection
              title="Using DigiLearn"
              items={["Video guide", "Finding teachers"]}
            />
          </ScrollView>
          <Pressable
            style={({ pressed }) => [
              styles.chatButton,
              { maxWidth: 420, alignSelf: "center" },
              pressed && styles.chatPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Chat with us"
          >
            <Feather
              name="message-circle"
              size={20}
              color={themeColors.white}
              fill={themeColors.white}
            />
            <Text style={styles.chatText}>Chat with us</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  page: { flex: 1, alignItems: "center" },
  contentContainer: { flex: 1, width: "100%" },
  container: { paddingTop: 38, paddingBottom: spacing.xxl },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  backButton: { marginRight: spacing.md, padding: 6 },
  title: { fontSize: 30, fontWeight: "700", color: colors.dark },
  section: { marginBottom: 34 },
  sectionTitle: {
    color: "#111",
    fontSize: 21,
    fontWeight: "600",
    marginBottom: 5,
  },
  items: { width: "100%" },
  item: {
    minHeight: 52,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemPressed: { opacity: 0.58 },
  itemText: { color: "#111", fontSize: 15, flexShrink: 1, paddingRight: 16 },
  chatButton: {
    height: 52,
    width: "100%",
    marginBottom: 8,
    borderRadius: 26,
    backgroundColor: "#FF646A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  chatPressed: { opacity: 0.78, transform: [{ scale: 0.99 }] },
  chatText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
