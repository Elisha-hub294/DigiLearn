import { Feather } from "@expo/vector-icons";
import {
  useFocusEffect,
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { useCallback, useState } from "react";
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

type LegalTab = "privacy" | "terms";

export default function TermsAndPoliciesScreen() {
  const { colors: themeColors, isDark } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams<{ tab?: string }>();
  const { width } = useWindowDimensions();

  const [activeTab, setActiveTab] = useState<LegalTab>(
    params.tab === "terms" ? "terms" : "privacy",
  );

  const horizontalPadding = getHorizontalPadding(width);
  const maxWidth = Math.min(1000, width - horizontalPadding * 2);

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        router.back();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      const unsubscribe = navigation.addListener("beforeRemove", (e: any) => {
        const actionType = e.data?.action?.type;
        if (actionType === "GO_BACK" || actionType === "POP") {
          // Allow default back navigation
          return;
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
          {/* Header */}
          <View
            style={[styles.headerRow, { paddingHorizontal: horizontalPadding }]}
          >
            <Pressable
              onPress={() => router.back()}
              style={styles.backButton}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Feather name="arrow-left" size={22} color={themeColors.text} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: themeColors.text }]}>
              Legal & Policies
            </Text>
          </View>

          {/* Segmented Tab Bar */}
          <View
            style={[
              styles.tabBarContainer,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            <View
              style={[
                styles.tabBar,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
            >
              <Pressable
                onPress={() => setActiveTab("privacy")}
                style={[
                  styles.tabButton,
                  activeTab === "privacy" && [
                    styles.tabButtonActive,
                    { backgroundColor: themeColors.white },
                  ],
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === "privacy" }}
                accessibilityLabel="Privacy Policy tab"
              >
                <Feather
                  name="shield"
                  size={16}
                  color={
                    activeTab === "privacy"
                      ? colors.primary
                      : themeColors.subtitle
                  }
                  style={styles.tabIcon}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === "privacy"
                          ? colors.primary
                          : themeColors.subtitle,
                      fontWeight: activeTab === "privacy" ? "700" : "500",
                    },
                  ]}
                >
                  Privacy Policy
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setActiveTab("terms")}
                style={[
                  styles.tabButton,
                  activeTab === "terms" && [
                    styles.tabButtonActive,
                    { backgroundColor: themeColors.white },
                  ],
                ]}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === "terms" }}
                accessibilityLabel="Terms of Service tab"
              >
                <Feather
                  name="file-text"
                  size={16}
                  color={
                    activeTab === "terms"
                      ? colors.primary
                      : themeColors.subtitle
                  }
                  style={styles.tabIcon}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color:
                        activeTab === "terms"
                          ? colors.primary
                          : themeColors.subtitle,
                      fontWeight: activeTab === "terms" ? "700" : "500",
                    },
                  ]}
                >
                  Terms of Service
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Policy / Terms Content */}
          <ScrollView
            style={{ backgroundColor: themeColors.background }}
            contentContainerStyle={[
              styles.scroll,
              {
                paddingHorizontal: horizontalPadding,
                backgroundColor: themeColors.background,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.effectiveBox}>
              <Text
                style={[styles.effectiveDate, { color: themeColors.subtitle }]}
              >
                Effective Date: September 2026 • Version 1.0
              </Text>
            </View>

            {activeTab === "privacy" ? (
              <PrivacyPolicyContent themeColors={themeColors} isDark={isDark} />
            ) : (
              <TermsOfServiceContent
                themeColors={themeColors}
                isDark={isDark}
              />
            )}

            <View style={styles.footerSpacing} />
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Section({
  title,
  icon,
  children,
  themeColors,
}: {
  title: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  children: React.ReactNode;
  themeColors: any;
}) {
  return (
    <View
      style={[
        styles.sectionCard,
        {
          backgroundColor: themeColors.white,
          borderColor: themeColors.border,
        },
      ]}
    >
      <View style={styles.sectionHeader}>
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: themeColors.primaryLight },
          ]}
        >
          <Feather name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
          {title}
        </Text>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function PrivacyPolicyContent({
  themeColors,
}: {
  themeColors: any;
  isDark: boolean;
}) {
  return (
    <View style={styles.contentWrapper}>
      <Text style={[styles.introText, { color: themeColors.text }]}>
        DigiLearn (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is
        dedicated to safeguarding your privacy and ensuring your educational
        experience is secure. This Privacy Policy explains what personal data we
        collect, why we collect it, how we handle it, and your complete rights
        to your information.
      </Text>

      <Section
        title="1. Information We Collect"
        icon="database"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          •{" "}
          <Text style={[styles.bold, { color: themeColors.text }]}>
            Account Credentials:
          </Text>{" "}
          Your full name, verified email address, account type (Student or
          Teacher), grade/academic level, school name, and chosen study
          subjects.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          •{" "}
          <Text style={[styles.bold, { color: themeColors.text }]}>
            Profile & Media:
          </Text>{" "}
          Optional profile pictures chosen from your photo library (we only
          access selected photos upon your explicit permission; we do not access
          your full library or microphone).
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          •{" "}
          <Text style={[styles.bold, { color: themeColors.text }]}>
            Educational & Study Activity:
          </Text>{" "}
          Books, past papers, and lessons you view, bookmark, or download for
          offline study, alongside reading progress and learning streaks.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          •{" "}
          <Text style={[styles.bold, { color: themeColors.text }]}>
            Educator Submissions:
          </Text>{" "}
          For teachers, professional qualifications, subject specialties,
          contact phone/WhatsApp, and resources you publish to the platform.
        </Text>
      </Section>

      <Section
        title="2. How We Use Your Information"
        icon="check-circle"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • To deliver and personalize curriculum materials tailored to your
          educational level and subjects.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • To support offline revision by synchronizing downloaded study
          resources securely to your device.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • To send study streak reminders, lesson updates, and important
          academic alerts (which you can disable at any time in Settings).
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • To maintain a safe, moderated learning environment free of
          inappropriate content.
        </Text>
      </Section>

      <Section
        title="3. DigiLearn AI Study Assistant"
        icon="cpu"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          Our AI Study Assistant allows learners to ask academic questions and
          receive instant guidance.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • AI requests are processed through secure server-side Google Cloud
          functions using Google Gemini models.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • Your queries are handled strictly for generating real-time study
          responses. Your conversations and private data are NOT sold or used to
          train public AI foundation models.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • You can disable AI Assistant features at any time in App Settings.
        </Text>
      </Section>

      <Section
        title="4. Data Retention & Full Account Deletion"
        icon="trash-2"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          We believe in complete user ownership of personal data in full
          compliance with Google Play and Apple App Store policies:
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          •{" "}
          <Text style={[styles.bold, { color: themeColors.text }]}>
            Self-Service Account Deletion:
          </Text>{" "}
          You can permanently delete your account and all associated data at any
          time by navigating to:
          {"\n"}
          <Text style={styles.codeQuote}>
            Settings &gt; Account &gt; Delete Account
          </Text>
          .
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          •{" "}
          <Text style={[styles.bold, { color: themeColors.text }]}>
            What gets deleted:
          </Text>{" "}
          Deleting your account immediately and irrevocably erases your
          authentication record, profile data, uploaded books, notes, past
          papers, bookmarks, study history, AI chat transcripts, and storage
          files from our servers.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • Alternatively, you can email our privacy team at{" "}
          <Text style={styles.linkText}>support@digilearn.com</Text> to request
          complete data erasure.
        </Text>
      </Section>

      <Section
        title="5. Security & Children's Privacy"
        icon="lock"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • DigiLearn is designed for primary, secondary, and advanced learners.
          We do not display behavioral advertising, tracking cookies, or sell
          student data to third parties.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • All communication between the app and our database is encrypted in
          transit using Transport Layer Security (TLS 1.3) and encrypted at rest
          using Google Cloud Firebase security architecture.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • Mandatory email verification ensures accounts belong to genuine
          learners and authorized educators.
        </Text>
      </Section>

      <Section
        title="6. Contact & Inquiries"
        icon="mail"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          For privacy questions, data export, or legal inquiries, please contact
          our Data Protection Officer at:
        </Text>
        <Text style={[styles.contactCard, { color: colors.primary }]}>
          support@digilearn.com
        </Text>
      </Section>
    </View>
  );
}

function TermsOfServiceContent({
  themeColors,
}: {
  themeColors: any;
  isDark: boolean;
}) {
  return (
    <View style={styles.contentWrapper}>
      <Text style={[styles.introText, { color: themeColors.text }]}>
        These Terms of Service (&quot;Terms&quot;) govern your access to and use
        of DigiLearn. By creating an account or accessing learning materials on
        the platform, you agree to be bound by these Terms.
      </Text>

      <Section
        title="1. Account Registration & Conduct"
        icon="user-check"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • You agree to provide accurate, truthful academic information during
          registration and maintain the security of your login credentials.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • You are responsible for all activities that occur under your
          account.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • You may not share your account or impersonate any student, teacher,
          institution, or administrator.
        </Text>
      </Section>

      <Section
        title="2. Educator Verification & Content Uploads"
        icon="award"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • Only verified and approved teachers may publish lessons, topical
          notes, books, and past revision papers.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • Educators must ensure uploaded materials are educational, accurate,
          age-appropriate, and compliant with national curriculum standards.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • Uploading copyrighted content without rightful authorization,
          academic dishonesty material, or offensive matter is strictly
          prohibited and will result in immediate removal and account
          suspension.
        </Text>
      </Section>

      <Section
        title="3. Intellectual Property Rights"
        icon="shield"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • DigiLearn, including its logo, interface, branding, algorithms, and
          software, is the exclusive intellectual property of DigiLearn.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • Authors and creators retain copyright in their original educational
          works, granting DigiLearn a non-exclusive license to host and
          distribute the content to registered learners on the platform.
        </Text>
      </Section>

      <Section
        title="4. Prohibited Uses"
        icon="slash"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          You agree not to:
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • Reverse engineer, decompile, or extract the source code of the app.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • Use automated bots, scrapers, or scripts to bulk-download materials
          or abuse the AI Assistant quotas.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • Harass, intimidate, or send unsolicited commercial communications to
          teachers or students.
        </Text>
      </Section>

      <Section
        title="5. Disclaimers & Limitation of Liability"
        icon="alert-circle"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • DigiLearn is provided on an &quot;as is&quot; and &quot;as
          available&quot; basis. While we strive for 100% curriculum accuracy,
          we do not warrant that study materials will guarantee specific
          examination grades.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • DigiLearn shall not be liable for indirect, incidental, or
          consequential damages resulting from service interruptions or loss of
          downloaded data.
        </Text>
      </Section>

      <Section
        title="6. Termination & Modifications"
        icon="clock"
        themeColors={themeColors}
      >
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • We reserve the right to suspend or terminate accounts that violate
          these terms or community guidelines.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          • We may update these Terms periodically. Continued use of DigiLearn
          following notice of changes constitutes agreement to the updated
          Terms.
        </Text>
        <Text style={[styles.paragraph, { color: themeColors.subtitle }]}>
          For inquiries regarding these Terms, contact{" "}
          <Text style={styles.linkText}>support@digilearn.com</Text>.
        </Text>
      </Section>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  page: { flex: 1, alignItems: "center" },
  contentContainer: { flex: 1, width: "100%" },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    marginTop: spacing.xs,
  },
  backButton: { marginRight: spacing.md, padding: 6 },
  headerTitle: { fontSize: 26, fontWeight: "700" },
  tabBarContainer: {
    marginBottom: spacing.md,
  },
  tabBar: {
    flexDirection: "row",
    padding: 4,
    borderRadius: 14,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
  },
  tabButtonActive: {
    boxShadow: "0px 1px 2px rgba(0, 0, 0, 0.08)",
    elevation: 2,
  },
  tabIcon: { marginRight: 6 },
  tabText: { fontSize: 14 },
  scroll: {
    paddingBottom: spacing.xxl * 2,
  },
  effectiveBox: {
    marginBottom: spacing.md,
  },
  effectiveDate: {
    fontSize: 12,
    fontWeight: "500",
  },
  contentWrapper: {
    gap: spacing.md,
  },
  introText: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: spacing.xs,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  sectionBody: {
    gap: 10,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
  },
  bold: {
    fontWeight: "700",
  },
  codeQuote: {
    fontFamily: "monospace",
    fontSize: 13,
    color: colors.primary,
  },
  linkText: {
    color: colors.primary,
    fontWeight: "600",
  },
  contactCard: {
    fontSize: 16,
    fontWeight: "700",
    marginTop: 4,
  },
  footerSpacing: {
    height: 40,
  },
});
