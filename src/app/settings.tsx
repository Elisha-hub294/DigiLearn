import { Feather as Icon } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { useCallback, useState } from "react";
import {
    BackHandler,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { auth } from "../../firebaseConfig";
import { ActionDialog } from "../components/ui/ActionDialog";
import SettingsRow from "../components/ui/SettingsRow";
import SettingsSection from "../components/ui/SettingsSection";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";

export default function SettingsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user, profile } = useProfile();
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const maxWidth = Math.min(1100, width - horizontalPadding * 2);

  const [pushEnabled, setPushEnabled] = useState(true);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [isLogoutDialogVisible, setLogoutDialogVisible] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const goToAccount = useCallback(() => {
    if (profile?.type === "teacher") {
      router.replace({
        pathname: "/teacher-profile",
        params: { name: profile.name, openedFromAccount: "true" },
      } as never);
      return;
    }

    router.replace("/profile" as never);
  }, [profile?.name, profile?.type, router]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      router.replace("/" as never);
    } catch (error) {
      console.error("Logout failed:", error);
      setLogoutError("We couldn't log you out. Please try again.");
    }
  }, [router]);

  useFocusEffect(
    useCallback(() => {
      // Android hardware back button handler
      const onBackPress = () => {
        goToAccount();
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress,
      );

      // Web browser back / navigation stack pop handler
      const unsubscribe = navigation.addListener("beforeRemove", (e) => {
        const actionType = e.data.action.type;
        if (actionType === "GO_BACK" || actionType === "POP") {
          e.preventDefault();
          goToAccount();
        }
      });

      return () => {
        subscription.remove();
        unsubscribe();
      };
    }, [goToAccount, navigation]),
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={[styles.contentContainer, { maxWidth }]}>
          <ScrollView
            contentContainerStyle={[
              styles.container,
              { paddingHorizontal: horizontalPadding },
            ]}
            style={styles.scroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerRow}>
              <Pressable
                onPress={goToAccount}
                style={styles.backButton}
                accessibilityLabel="Back to profile"
              >
                <Icon name="arrow-left" size={22} color={colors.dark} />
              </Pressable>
              <Text style={styles.title}>Settings</Text>
            </View>

            {/* Account Section */}
            <Text style={styles.sectionTitle}>Account</Text>
            <SettingsSection>
              <SettingsRow
                icon="user"
                title="My Profile"
                onPress={() => router.push("/my-profile" as never)}
              />
              <SettingsRow
                icon="settings"
                title="My Preferences"
                onPress={() => router.push("/preferences" as never)}
              />
              <SettingsRow
                icon="clock"
                title="Activity"
                onPress={() => router.push("/activity" as never)}
              />
              <SettingsRow
                icon="eye-off"
                title="Hidden items"
                onPress={() => router.push("/hidden-items" as never)}
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
                onPress={() => router.push("/help" as never)}
              />
              <SettingsRow
                icon="file-text"
                title="Terms and Policies"
                onPress={() => {}}
              />
              <SettingsRow
                icon="info"
                title="About"
                onPress={() => router.push("/about" as never)}
                showSeparator={false}
              />
            </SettingsSection>

            {user ? (
              <>
                <View style={{ height: 30 }} />
                <Pressable
                  onPress={() => setLogoutDialogVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel="Logout"
                >
                  <View style={styles.logoutRow}>
                    <Icon name="log-out" size={18} color="#FF4D4D" />
                    <Text style={styles.logoutText}>Logout</Text>
                  </View>
                </Pressable>
                <View style={{ height: 60 }} />
              </>
            ) : null}
          </ScrollView>
        </View>
      </View>

      <ActionDialog
        visible={isLogoutDialogVisible}
        icon={<Icon name="log-out" size={24} color="#DC2626" />}
        title="Log out?"
        message="Are you sure you want to log out of DigiLearn?"
        primaryText="Log out"
        secondaryText="Cancel"
        primaryButtonColor="#DC2626"
        onPrimary={handleLogout}
        onSecondary={() => setLogoutDialogVisible(false)}
        onClose={() => setLogoutDialogVisible(false)}
      />
      <ActionDialog
        visible={logoutError !== null}
        title="Unable to log out"
        message={logoutError ?? ""}
        primaryText="OK"
        onPrimary={() => setLogoutError(null)}
        onClose={() => setLogoutError(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.white },
  page: { flex: 1, alignItems: "center" },
  contentContainer: { flex: 1, width: "100%" },
  scroll: { flex: 1, width: "100%" },
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
