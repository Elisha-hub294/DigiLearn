import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors, radius, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";

export function PublicHome() {
  const { colors: themeColors, isDark } = useTheme();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const horizontalPadding = width >= 1200 ? 64 : width >= 600 ? 36 : 20;
  const contentMaxWidth = 1200;
  const isCompact = width < 760;
  const heroArtSize = Math.min(
    330,
    Math.max(220, width - horizontalPadding * 2),
  );
  const titleSize = width < 420 ? 38 : 46;

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: themeColors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.content,
            { maxWidth: contentMaxWidth, paddingHorizontal: horizontalPadding },
          ]}
        >
          <View style={[styles.navbar, isCompact && styles.compactNavbar]}>
            <View style={styles.brandRow}>
              <Image
                source={require("../../../assets/images/panda.png")}
                style={styles.logo}
                contentFit="contain"
                accessible
                accessibilityRole="image"
                alt="OS platform logo"
              />
              <Text style={[styles.brand, { color: themeColors.dark }]}>
                OS platform
              </Text>
            </View>
            <View style={styles.navActions}>
              <Pressable
                onPress={() =>
                  router.push("/terms-and-policies?tab=privacy" as never)
                }
                accessibilityRole="link"
                accessibilityLabel="Read OS platform privacy policy"
              >
                <Text style={[styles.navLink, { color: themeColors.text }]}>
                  Privacy
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push({
                    pathname: "/login",
                    params: { from: "welcome" },
                  })
                }
                style={styles.navButton}
                accessibilityRole="button"
                accessibilityLabel="Log in to OS platform"
              >
                <Text style={styles.navButtonText}>Log in</Text>
              </Pressable>
            </View>
          </View>

          <View style={[styles.hero, isCompact && styles.compactHero]}>
            <View style={styles.heroCopy}>
              <Text style={[styles.eyebrow, { color: colors.primary }]}>
                LEARN WITH CONFIDENCE
              </Text>
              <Text
                style={[
                  styles.title,
                  {
                    color: themeColors.dark,
                    fontSize: titleSize,
                    lineHeight: titleSize + 8,
                  },
                ]}
              >
                A better way to study.
              </Text>
              <Text
                style={[styles.description, { color: themeColors.subtitle }]}
              >
                OS platform is an educational platform for students and teachers
                to discover study materials, revise with past papers, learn from
                qualified educators, and get help from an AI study assistant.
              </Text>
              <View style={styles.heroActions}>
                <Pressable
                  onPress={() =>
                    router.push({
                      pathname: "/signup",
                      params: { from: "welcome" },
                    })
                  }
                  style={styles.primaryButton}
                  accessibilityRole="button"
                  accessibilityLabel="Create a OS platform account"
                >
                  <Text style={styles.primaryButtonText}>
                    Create an account
                  </Text>
                  <Feather name="arrow-right" size={17} color={colors.white} />
                </Pressable>
                <Pressable
                  onPress={() => router.push("/" as never)}
                  style={[
                    styles.exploreButton,
                    { borderColor: colors.primary },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Explore OS platform"
                >
                  <Text
                    style={[
                      styles.exploreButtonText,
                      { color: colors.primary },
                    ]}
                  >
                    Explore OS platform
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() =>
                    router.push("/terms-and-policies?tab=privacy" as never)
                  }
                  accessibilityRole="link"
                  accessibilityLabel="Read how OS platform handles privacy"
                >
                  <Text style={[styles.policyLink, { color: colors.primary }]}>
                    How we handle privacy
                  </Text>
                </Pressable>
              </View>
            </View>
            <View
              style={[
                styles.heroArt,
                isCompact && styles.compactHeroArt,
                { width: isCompact ? heroArtSize : 330, height: heroArtSize },
                { backgroundColor: colors.primaryLight },
              ]}
            >
              <Image
                source={require("../../../assets/images/panda.png")}
                style={styles.heroImage}
                contentFit="contain"
                accessible
                accessibilityRole="image"
                alt="OS platform learning illustration"
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.dark }]}>
              Everything you need to keep learning
            </Text>
            <View style={styles.featureGrid}>
              <Feature
                icon="book-open"
                title="Study resources"
                text="Find textbooks, topical notes, lessons, and revision materials in one place."
                themeColors={themeColors}
              />
              <Feature
                icon="file-text"
                title="Exam preparation"
                text="Practice with past papers and organize the resources you need for revision."
                themeColors={themeColors}
              />
              <Feature
                icon="users"
                title="Learn together"
                text="Connect with verified educators and share knowledge with your learning community."
                themeColors={themeColors}
              />
              <Feature
                icon="cpu"
                title="AI study support"
                text="Ask academic questions and receive guidance while you work through difficult topics."
                themeColors={themeColors}
              />
            </View>
          </View>

          <View style={[styles.footer, { borderTopColor: themeColors.border }]}>
            <Text style={[styles.footerText, { color: themeColors.subtitle }]}>
              OS platform helps students and educators access focused, practical
              learning support.
            </Text>
            <View style={styles.footerLinks}>
              <Pressable
                onPress={() =>
                  router.push("/terms-and-policies?tab=privacy" as never)
                }
                accessibilityRole="link"
              >
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  Privacy Policy
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  router.push("/terms-and-policies?tab=terms" as never)
                }
                accessibilityRole="link"
              >
                <Text style={[styles.footerLink, { color: colors.primary }]}>
                  Terms of Service
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Feature({
  icon,
  title,
  text,
  themeColors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  text: string;
  themeColors: {
    text: string;
    subtitle: string;
    white: string;
    border: string;
    primaryLight: string;
  };
}) {
  return (
    <View
      style={[
        styles.feature,
        { backgroundColor: themeColors.white, borderColor: themeColors.border },
      ]}
    >
      <View
        style={[
          styles.featureIcon,
          { backgroundColor: themeColors.primaryLight },
        ]}
      >
        <Feather name={icon} size={19} color={colors.primary} />
      </View>
      <Text style={[styles.featureTitle, { color: themeColors.text }]}>
        {title}
      </Text>
      <Text style={[styles.featureText, { color: themeColors.subtitle }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { alignItems: "center", paddingBottom: spacing.xxl },
  content: { width: "100%" },
  navbar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  compactNavbar: {
    flexWrap: "wrap",
    rowGap: spacing.md,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logo: { width: 38, height: 38 },
  brand: { fontSize: 22, fontWeight: "800" },
  navActions: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  navLink: { fontSize: 14, fontWeight: "600" },
  navButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
  },
  navButtonText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xxl,
    paddingVertical: 70,
  },
  compactHero: {
    flexDirection: "column",
    gap: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  heroCopy: { flex: 1, minWidth: 0 },
  eyebrow: {
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 46,
    lineHeight: 54,
    fontWeight: "800",
    marginBottom: spacing.md,
  },
  description: { fontSize: 17, lineHeight: 28, maxWidth: 650 },
  heroActions: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.lg,
    marginTop: spacing.xl,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  exploreButton: {
    borderWidth: 1,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 13,
  },
  exploreButtonText: { fontSize: 15, fontWeight: "700" },
  policyLink: { fontSize: 14, fontWeight: "700" },
  heroArt: {
    width: 330,
    height: 330,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  compactHeroArt: { alignSelf: "center" },
  heroImage: { width: "86%", height: "86%" },
  section: { paddingVertical: spacing.xxl },
  sectionTitle: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: "800",
    marginBottom: spacing.lg,
  },
  featureGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  feature: {
    flexGrow: 1,
    flexBasis: 230,
    minHeight: 170,
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  featureTitle: { fontSize: 16, fontWeight: "800", marginBottom: spacing.sm },
  featureText: { fontSize: 14, lineHeight: 21 },
  footer: {
    borderTopWidth: 1,
    paddingVertical: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.lg,
    flexWrap: "wrap",
  },
  footerText: { fontSize: 13, lineHeight: 20, flex: 1, minWidth: 240 },
  footerLinks: { flexDirection: "row", flexWrap: "wrap", gap: spacing.lg },
  footerLink: { fontSize: 13, fontWeight: "700" },
});
