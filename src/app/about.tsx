import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { formatAppVersion, getAppVersion } from "../services/appInfoService";

const ABOUT_DESCRIPTION =
  "DigiLearn is an educational platform that helps learners access academic resources, lessons, books, past papers, and teachers in one place, making quality learning more accessible and convenient.";

const BRAND_BLUE = "#3B82F6";

type AboutRowProps = {
  icon: React.ComponentProps<typeof Feather>["name"];
  iconColor?: string;
  title: string;
  subtitle?: string;
  showChevron?: boolean;
  onPress?: () => void;
  showSeparator?: boolean;
};

function AboutRow({
  icon,
  iconColor = "#111111",
  title,
  subtitle,
  showChevron = true,
  onPress,
  showSeparator = true,
}: AboutRowProps) {
  const { colors } = useTheme();
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.white },
          pressed && { backgroundColor: colors.lightBackground },
        ]}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}, ${subtitle}` : title}
      >
        <View style={styles.iconSlot}>
          <Feather
            name={icon}
            size={20}
            color={iconColor === "#111111" ? colors.text : iconColor}
          />
        </View>
        <View style={styles.rowText}>
          <Text
            style={[
              styles.rowTitle,
              { color: colors.text },
              subtitle && styles.rowTitleCompact,
            ]}
          >
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.rowSubtitle, { color: colors.subtitle }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {showChevron ? (
          <Feather name="chevron-right" size={20} color={colors.text} />
        ) : (
          <View style={styles.chevronPlaceholder} />
        )}
      </Pressable>
      {showSeparator ? (
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
      ) : null}
    </View>
  );
}

export default function AboutScreen() {
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { width } = useWindowDimensions();

  const horizontalPadding = getHorizontalPadding(width);
  const maxWidth = Math.min(1100, width - horizontalPadding * 2);
  const pandaSize = Math.min(210, Math.max(170, width * 0.48));

  const [version, setVersion] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getAppVersion().then((value) => {
      if (mounted) {
        setVersion(value);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

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

  const versionLabel = useMemo(
    () => (version ? formatAppVersion(version) : "digilearn@…"),
    [version],
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
              accessibilityRole="button"
              accessibilityLabel="Back to Settings"
            >
              <Feather name="arrow-left" size={22} color={colors.dark} />
            </Pressable>
            <Text style={[styles.title, { color: themeColors.dark }]}>
              About
            </Text>
          </View>

          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingHorizontal: horizontalPadding },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.branding}>
              <Image
                source={require("@/assets/images/panda.png")}
                style={{ width: pandaSize, height: pandaSize }}
                contentFit="contain"
                accessible
                accessibilityRole="image"
                accessibilityLabel="DigiLearn panda mascot"
              />
              <Text style={styles.brand} accessibilityRole="header">
                <Text style={styles.brandBlack}>Digi</Text>
                <Text style={styles.brandAccent}>Learn</Text>
              </Text>
            </View>

            <View
              style={[
                styles.aboutCard,
                {
                  backgroundColor: themeColors.primaryLight,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Text style={[styles.aboutTitle, { color: themeColors.text }]}>
                About
              </Text>
              <Text
                style={[
                  styles.aboutDescription,
                  { color: themeColors.subtitle },
                ]}
              >
                {ABOUT_DESCRIPTION}
              </Text>
            </View>

            <View
              style={[
                styles.list,
                {
                  backgroundColor: themeColors.white,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <AboutRow
                icon="star"
                title="Rate Us on Play Store"
                onPress={() => {}}
              />
              <AboutRow
                icon="message-circle"
                iconColor={BRAND_BLUE}
                title="Feedback & Support"
                onPress={() => {}}
              />
              <AboutRow
                icon="globe"
                iconColor={BRAND_BLUE}
                title="Official Website"
                subtitle="digilearn.com"
                onPress={() => {}}
              />
              <AboutRow
                icon="info"
                iconColor={BRAND_BLUE}
                title="App Version"
                subtitle={versionLabel}
                showChevron={false}
                showSeparator={false}
                onPress={() => {}}
              />
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Copyright © 2026 DigiLearn. All rights reserved.
              </Text>
              <Text style={styles.footerText}>
                Developed with passion in Kampala.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  page: { flex: 1, alignItems: "center" },
  contentContainer: { flex: 1, width: "100%" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  backButton: { marginRight: spacing.md, padding: 6 },
  scroll: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  branding: {
    alignItems: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  title: { fontSize: 30, fontWeight: "700", color: colors.dark },
  brand: {
    fontSize: 32,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  brandBlack: {
    color: "#000000",
  },
  brandAccent: {
    color: BRAND_BLUE,
  },
  aboutCard: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#C7D7E5",
    borderRadius: 6,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    marginBottom: spacing.xl,
  },
  aboutTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: spacing.sm,
  },
  aboutDescription: {
    fontSize: 12,
    lineHeight: 18,
    color: "#6B7280",
    fontWeight: "400",
  },
  list: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: "#DDDDDD",
    borderRadius: 10,
    overflow: "hidden",
  },
  row: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
  },
  rowPressed: {
    backgroundColor: "#F5F5F5",
    opacity: 0.92,
  },
  iconSlot: {
    width: 28,
    alignItems: "center",
    marginRight: spacing.md,
  },
  rowText: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: spacing.sm,
  },
  rowTitle: {
    fontSize: 14,
    color: "#111111",
    fontWeight: "400",
  },
  rowTitleCompact: {
    fontSize: 13,
  },
  rowSubtitle: {
    fontSize: 11,
    color: "#8A8A8A",
    marginTop: 2,
  },
  chevronPlaceholder: {
    width: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginLeft: 56,
  },
  footer: {
    marginTop: "auto" as const,
    paddingTop: spacing.xxl,
    alignItems: "center",
    gap: 6,
  },
  footerText: {
    fontSize: 10,
    lineHeight: 15,
    color: "#31527F",
    textAlign: "center",
  },
});
