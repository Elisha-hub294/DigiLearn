import { Feather as Icon } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import SettingsRow from "../components/ui/SettingsRow";
import SettingsSection from "../components/ui/SettingsSection";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";

export default function SettingsScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const maxWidth = Math.min(1100, width - horizontalPadding * 2);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingHorizontal: horizontalPadding, maxWidth },
        ]}
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            accessibilityLabel="Go back"
          >
            <Icon name="arrow-left" size={22} color={colors.dark} />
          </Pressable>
          <Text style={styles.title}>Settings</Text>
        </View>

        {/* Account Section */}
        <Text style={styles.sectionTitle}>Account</Text>
        <SettingsSection>
          <SettingsRow icon="user" title="My Profile" onPress={() => router.push("/my-profile" as never)} />
          <SettingsRow
            icon="settings"
            title="My Preferences"
            onPress={() => router.push("/preferences" as never)}
          />
          <SettingsRow
            icon="clock"
            title="Activity"
            onPress={() => {}}
            showSeparator={false}
          />
        </SettingsSection>

        {/* Notifications */}
        <View style={{ height: spacing.xxl }} />
        <Text style={styles.sectionTitle}>Notifications</Text>
        <SettingsSection>
          <SettingsRow
            title="Push Notifications"
            right={
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                accessibilityLabel="Toggle push notifications"
              />
            }
            onPress={() => setPushEnabled((s) => !s)}
          />
          <SettingsRow
            title="Reminders"
            right={
              <Switch
                value={remindersEnabled}
                onValueChange={setRemindersEnabled}
                accessibilityLabel="Toggle reminders"
              />
            }
            showSeparator={false}
            onPress={() => setRemindersEnabled((s) => !s)}
          />
        </SettingsSection>

        {/* Help & Information */}
        <View style={{ height: spacing.xxl }} />
        <Text style={styles.sectionTitle}>Help & Information</Text>
        <SettingsSection>
          <SettingsRow
            icon="headphones"
            title="Help and Support"
            onPress={() => {}}
          />
          <SettingsRow
            icon="file-text"
            title="Terms and Policies"
            onPress={() => {}}
          />
          <SettingsRow
            icon="info"
            title="About"
            onPress={() => {}}
            showSeparator={false}
          />
        </SettingsSection>

        {/* Logout */}
        <View style={{ height: 30 }} />
        <Pressable
          onPress={() => {}}
          accessibilityRole="button"
          accessibilityLabel="Logout"
        >
          <View style={styles.logoutRow}>
            <Icon name="log-out" size={18} color="#FF4D4D" />
            <Text style={styles.logoutText}>Logout</Text>
          </View>
        </Pressable>

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  scroll: { alignSelf: "center", width: "100%" },
  container: { paddingTop: spacing.xxl },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  backButton: { marginRight: spacing.md, padding: 6 },
  title: { fontSize: 30, fontWeight: "700", color: colors.dark },
  sectionTitle: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  logoutRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoutText: {
    color: "#FF4D4D",
    fontSize: 14,
    marginLeft: 12,
    fontWeight: "600",
  },
});
