import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  BackHandler,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ActionDialog } from "../components/ui/ActionDialog";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { useTheme } from "../contexts/ThemeContext";

type FaqDetail = {
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
};

const FAQ_DATA: Record<string, FaqDetail> = {
  "Downloading files": {
    title: "Downloading files",
    message:
      "To download books, topical notes, or past papers for offline study, open any resource and tap the 'Download' icon. The document will be saved directly to your device.",
  },
  "Offline file access": {
    title: "Offline file access",
    message:
      "You can read all your downloaded books and papers anytime, anywhere, even without an active internet connection. Access them directly under the Downloads section in your Library.",
  },
  "Report a problem": {
    title: "Report a problem",
    message:
      "Encountered a glitch, broken link, or inappropriate content? Let us know immediately and our support team will resolve it.",
    actionText: "Email Support",
    onAction: () => {
      Linking.openURL(
        "mailto:support@digilearn.com?subject=DigiLearn%20Problem%20Report",
      );
    },
  },
  Email: {
    title: "Email & Verification",
    message:
      "Your email is your primary key for logging in and recovering your account. Mandatory email verification protects your account and keeps the DigiLearn community safe.",
  },
  "Academic level": {
    title: "Academic Level",
    message:
      "You can customize your academic level (such as Primary, O-Level, or A-Level) in your profile preferences to ensure your feed shows materials for your curriculum.",
  },
  "Changing my subjects": {
    title: "Changing your subjects",
    message:
      "Want to revise different subjects? Update your selected subjects anytime in Preferences to tailor your recommended lessons, past papers, and teacher updates.",
  },

  "Finding teachers": {
    title: "Finding Verified Teachers",
    message:
      "Explore the Teachers tab to find accredited educators across all disciplines. View their published books, past papers, and contact them directly via WhatsApp or phone call.",
  },
};

type HelpSectionProps = {
  title: string;
  items: string[];
  onSelectItem: (item: string) => void;
};

function HelpItem({ title, onPress }: { title: string; onPress?: () => void }) {
  const { colors: themeColors } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        { borderBottomColor: themeColors.border },
        pressed && styles.itemPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      <Text style={[styles.itemText, { color: themeColors.text }]}>
        {title}
      </Text>
      <Feather name="chevron-right" size={20} color={themeColors.subtitle} />
    </Pressable>
  );
}

function HelpSection({ title, items, onSelectItem }: HelpSectionProps) {
  const { colors: themeColors } = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: themeColors.text }]}>
        {title}
      </Text>
      <View
        style={[
          styles.itemsCard,
          {
            backgroundColor: themeColors.white,
            borderColor: themeColors.border,
          },
        ]}
      >
        {items.map((item, index) => (
          <HelpItem
            key={item}
            title={item}
            onPress={() => onSelectItem(item)}
          />
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

  const [activeFaq, setActiveFaq] = useState<FaqDetail | null>(null);
  const [isChatDialogOpen, setChatDialogOpen] = useState(false);

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

  const handleSelectItem = (item: string) => {
    const faq = FAQ_DATA[item] ?? {
      title: item,
      message:
        "For additional help with this topic, please contact our support team.",
      actionText: "Email Support",
      onAction: () => {
        Linking.openURL(
          `mailto:support@digilearn.com?subject=Help%20Request:%20${encodeURIComponent(item)}`,
        );
      },
    };
    setActiveFaq(faq);
  };

  const handleOpenWhatsApp = () => {
    setChatDialogOpen(false);
    const message = encodeURIComponent(
      "Hello DigiLearn Support, I need help with the app.",
    );
    Linking.openURL(`https://wa.me/256700000000?text=${message}`);
  };

  const handleOpenEmail = () => {
    setChatDialogOpen(false);
    Linking.openURL(
      "mailto:support@digilearn.com?subject=DigiLearn%20Support%20Inquiry",
    );
  };

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
              <Feather name="arrow-left" size={22} color={themeColors.text} />
            </Pressable>
            <Text style={[styles.title, { color: themeColors.text }]}>
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
              onSelectItem={handleSelectItem}
            />
            <HelpSection
              title="Account"
              items={["Email", "Academic level", "Changing my subjects"]}
              onSelectItem={handleSelectItem}
            />
            <HelpSection
              title="Using DigiLearn"
              items={["Video guide", "Finding teachers"]}
              onSelectItem={handleSelectItem}
            />
          </ScrollView>

          {/* Chat with us human support button */}
          <View
            style={[
              styles.footerContainer,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            <Pressable
              onPress={() => setChatDialogOpen(true)}
              style={({ pressed }) => [
                styles.chatButton,
                { maxWidth: 420, alignSelf: "center" },
                pressed && styles.chatPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Chat with us"
            >
              <Feather name="message-circle" size={20} color={colors.white} />
              <Text style={styles.chatText}>Chat with us</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* FAQ Detail Dialog */}
      <ActionDialog
        visible={activeFaq !== null}
        title={activeFaq?.title ?? ""}
        message={activeFaq?.message ?? ""}
        primaryText="Got it"
        secondaryText={activeFaq?.actionText}
        onPrimary={() => setActiveFaq(null)}
        onSecondary={
          activeFaq?.onAction
            ? () => {
                setActiveFaq(null);
                activeFaq.onAction?.();
              }
            : undefined
        }
        onClose={() => setActiveFaq(null)}
        icon={<Feather name="help-circle" size={24} color={colors.primary} />}
      />

      {/* Chat With Us Support Channel Dialog */}
      <ActionDialog
        visible={isChatDialogOpen}
        title="Contact DigiLearn Support"
        message="Our support team is here to assist you. Choose how you would like to reach us:"
        primaryText="WhatsApp Support"
        secondaryText="Email Support"
        onPrimary={handleOpenWhatsApp}
        onSecondary={handleOpenEmail}
        onClose={() => setChatDialogOpen(false)}
        icon={<Feather name="headphones" size={24} color={colors.primary} />}
        primaryButtonColor="#25D366"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  page: { flex: 1, alignItems: "center" },
  contentContainer: { flex: 1, width: "100%" },
  container: { paddingTop: spacing.md, paddingBottom: spacing.xl },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
  },
  backButton: { marginRight: spacing.md, padding: 6 },
  title: { fontSize: 28, fontWeight: "700" },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.sm,
  },
  itemsCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  item: {
    minHeight: 52,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },
  itemPressed: { opacity: 0.65 },
  itemText: {
    fontSize: 15,
    fontWeight: "500",
    flexShrink: 1,
    paddingRight: 16,
  },
  footerContainer: {
    paddingBottom: spacing.md,
    width: "100%",
  },
  chatButton: {
    height: 52,
    width: "100%",
    borderRadius: 26,
    backgroundColor: "#FF646A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    boxShadow: "0px 4px 8px rgba(255, 100, 106, 0.25)",
    elevation: 4,
  },
  chatPressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  chatText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
