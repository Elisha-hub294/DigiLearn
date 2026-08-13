import { Feather as Icon } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  BackHandler,
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import ActivityCard from "../components/ui/ActivityCard";
import ActivitySkeleton from "../components/ui/ActivitySkeleton";
import { getHorizontalPadding } from "../constants/layout";
import { colors, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import { fetchUserActivity } from "../services/activityService";
import { ActivityItem } from "../types/activity";

export default function ActivityScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { user } = useProfile();
  const { width } = useWindowDimensions();

  const horizontalPadding = getHorizontalPadding(width);
  const maxWidth = Math.min(1100, width - horizontalPadding * 2);

  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      setActivities([]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchUserActivity(user.uid);
      setActivities(data);
    } catch (err) {
      console.error("ActivityScreen loadData error:", err);
      setError("Unable to load activity right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadData();

      // Android hardware back button handler
      const onBackPress = () => {
        router.replace("/settings" as never);
        return true;
      };

      const subscription = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );

      // Web browser back / navigation stack pop handler
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
    }, [navigation, router, loadData])
  );

  const handleCardPress = (item: ActivityItem) => {
    try {
      if (item.type === "lesson") {
        router.push({
          pathname: "/lesson-player",
          params: item.rawDoc ? { ...item.rawDoc } : { id: item.targetId },
        } as never);
      } else if (item.type === "page") {
        router.push({
          pathname: "/page-preview",
          params: item.rawDoc ? { ...item.rawDoc } : { id: item.targetId },
        } as never);
      } else if (item.type === "book") {
        router.push({
          pathname: "/book-preview",
          params: item.rawDoc ? { ...item.rawDoc } : { id: item.targetId },
        } as never);
      }
    } catch (e) {
      console.warn("Navigation error on activity card tap:", e);
    }
  };

  const renderContent = () => {
    // 1. Loading State
    if (loading) {
      return <ActivitySkeleton />;
    }

    // 2. Unauthenticated State
    if (!user) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="clock" size={32} color="#3B82F6" />
          </View>
          <Text style={styles.emptyTitle}>Your activity will appear here</Text>
          <Text style={styles.emptySubtitle}>
            Log in or sign up to keep track of the lessons, pages, and books you've opened on DigiLearn.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/welcome" as never)}
            accessibilityRole="button"
            accessibilityLabel="Log in or Sign up"
          >
            <Text style={styles.primaryButtonText}>Log in or Sign up</Text>
          </Pressable>
        </View>
      );
    }

    // 3. Error State
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: "#FEE2E2" }]}>
            <Icon name="alert-circle" size={32} color="#EF4444" />
          </View>
          <Text style={styles.emptyTitle}>Something went wrong</Text>
          <Text style={styles.emptySubtitle}>{error}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={loadData}
          >
            <Text style={styles.primaryButtonText}>Try Again</Text>
          </Pressable>
        </View>
      );
    }

    // 4. Authenticated Empty Activity State
    if (activities.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Icon name="book-open" size={32} color="#3B82F6" />
          </View>
          <Text style={styles.emptyTitle}>No activity yet</Text>
          <Text style={styles.emptySubtitle}>
            Start exploring lessons, books, and academic resources. Your recently opened items will appear here.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push("/" as never)}
            accessibilityRole="button"
            accessibilityLabel="Explore DigiLearn"
          >
            <Text style={styles.primaryButtonText}>Explore DigiLearn</Text>
          </Pressable>
        </View>
      );
    }

    // 5. Activity List
    return (
      <FlatList
        data={activities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ActivityCard item={item} onPress={() => handleCardPress(item)} />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <View style={[styles.contentContainer, { maxWidth }]}>
          {/* Header */}
          <View
            style={[
              styles.headerRow,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            <Pressable
              onPress={() => router.replace("/settings" as never)}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.backButtonPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Back to Settings"
            >
              <Icon name="chevron-left" size={24} color="#111111" />
            </Pressable>
            <Text style={styles.title}>Activity</Text>
          </View>

          {/* Body Content */}
          <View
            style={[
              styles.body,
              { paddingHorizontal: horizontalPadding },
            ]}
          >
            {renderContent()}
          </View>
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  backButton: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
    marginLeft: -8,
  },
  backButtonPressed: {
    opacity: 0.6,
  },
  title: {
    fontSize: 31,
    fontWeight: "700",
    color: "#111111",
  },
  body: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: "#6B6B6B",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 24,
    maxWidth: 320,
  },
  primaryButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
