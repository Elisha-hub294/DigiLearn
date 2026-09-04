import { Feather as Icon } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Skeleton } from "../components/ui/Skeleton";
import { getHorizontalPadding } from "../constants/layout";
import { colors, radius, spacing } from "../constants/theme";
import { useProfile } from "../contexts/ProfileContext";
import {
  ActivityEvent,
  fetchActivityEvents,
} from "../services/activityService";

type Range = "all" | "7d" | "30d";
type ActivityFilter = "all" | ActivityEvent["type"];

const dateFrom = (value: string) => new Date(value).getTime() || 0;
const labelForType = (type: string) =>
  type.charAt(0).toUpperCase() + type.slice(1);

export default function AdminActivityScreen() {
  const router = useRouter();
  const { profile } = useProfile();
  const { width } = useWindowDimensions();
  const horizontalPadding = getHorizontalPadding(width);
  const maxWidth = Math.min(1100, width - horizontalPadding * 2);
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [range, setRange] = useState<Range>("7d");
  const [activityFilter, setActivityFilter] = useState<ActivityFilter>("all");
  const [search, setSearch] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (profile?.type !== "admin") return;
    setCurrentTime(Date.now());
    setLoading(true);
    setError(null);
    try {
      setEvents(await fetchActivityEvents());
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Unable to load usage data.",
      );
    } finally {
      setLoading(false);
    }
  }, [profile?.type]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const visibleEvents = useMemo(() => {
    const cutoff =
      range === "all" ? 0 : currentTime - (range === "7d" ? 7 : 30) * 86400000;
    const query = search.trim().toLowerCase();
    return events.filter((event) => {
      const matchesRange = dateFrom(event.openedAt) >= cutoff;
      const matchesType =
        activityFilter === "all" || event.type === activityFilter;
      const matchesSearch =
        !query ||
        [event.userName, event.userEmail, event.userId, event.resourceId].some(
          (value) => value?.toLowerCase().includes(query),
        );
      return matchesRange && matchesType && matchesSearch;
    });
  }, [activityFilter, currentTime, events, range, search]);

  const metrics = useMemo(() => {
    const uniqueUsers = new Set(visibleEvents.map((event) => event.userId))
      .size;
    const uniqueResources = new Set(
      visibleEvents.map((event) => event.resourceId),
    ).size;
    const eventCountsByUser = visibleEvents.reduce<Record<string, number>>(
      (counts, event) => {
        counts[event.userId] = (counts[event.userId] || 0) + 1;
        return counts;
      },
      {},
    );
    const returningUsers = Object.values(eventCountsByUser).filter(
      (count) => count > 1,
    ).length;
    const average = (days: number) =>
      Math.round(
        events.filter(
          (event) => dateFrom(event.openedAt) >= currentTime - days * 86400000,
        ).length / days,
      );
    const resourceCounts = visibleEvents.reduce<Record<string, number>>(
      (counts, event) => {
        counts[event.resourceId] = (counts[event.resourceId] || 0) + 1;
        return counts;
      },
      {},
    );
    const topResources = Object.entries(resourceCounts)
      .sort((first, second) => second[1] - first[1])
      .slice(0, 5);
    const dailyTrend = Array.from({ length: 7 }, (_, index) => {
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      dayStart.setDate(dayStart.getDate() - (6 - index));
      const nextDay = dayStart.getTime() + 86400000;
      return {
        label: dayStart
          .toLocaleDateString(undefined, { weekday: "short" })
          .slice(0, 2),
        count: events.filter(
          (event) =>
            dateFrom(event.openedAt) >= dayStart.getTime() &&
            dateFrom(event.openedAt) < nextDay,
        ).length,
      };
    });
    return {
      uniqueUsers,
      uniqueResources,
      returningUsers,
      average,
      topResources,
      dailyTrend,
    };
  }, [currentTime, events, visibleEvents]);

  const copyReport = useCallback(async () => {
    const header = "date,user,email,type,resourceId";
    const rows = visibleEvents.map((event) =>
      [
        event.openedAt,
        event.userName,
        event.userEmail,
        event.type,
        event.resourceId,
      ]
        .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
        .join(","),
    );
    await Clipboard.setStringAsync([header, ...rows].join("\n"));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }, [visibleEvents]);

  if (profile?.type !== "admin") return null;

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
            <View style={styles.header}>
              <Pressable
                onPress={() => router.replace("/settings" as never)}
                style={styles.back}
                accessibilityLabel="Back to settings"
              >
                <Icon name="arrow-left" size={22} color={colors.dark} />
              </Pressable>
              <View>
                <Text style={styles.eyebrow}>ADMIN INSIGHTS</Text>
                <Text style={styles.title}>App usage</Text>
              </View>
              <Pressable
                onPress={load}
                style={styles.refresh}
                accessibilityLabel="Refresh app usage"
              >
                <Icon name="refresh-cw" size={18} color={colors.primary} />
              </Pressable>
              <Pressable
                onPress={copyReport}
                style={styles.exportButton}
                accessibilityLabel="Copy usage report"
              >
                <Icon name="download" size={18} color={colors.white} />
                <Text style={styles.exportText}>
                  {copied ? "Copied" : "Export"}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.subtitle}>
              Understand who is learning and which resources deserve attention.
            </Text>

            <View style={styles.rangeRow}>
              {(["7d", "30d", "all"] as Range[]).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setRange(item)}
                  style={[
                    styles.rangeButton,
                    range === item && styles.rangeSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.rangeText,
                      range === item && styles.rangeTextSelected,
                    ]}
                  >
                    {item === "all"
                      ? "All time"
                      : item === "7d"
                        ? "Last 7 days"
                        : "Last 30 days"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.searchBox}>
              <Icon name="search" size={17} color={colors.subtitle} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search users or resources"
                placeholderTextColor={colors.subtitle}
                style={styles.searchInput}
                accessibilityLabel="Search activity"
              />
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterRow}
            >
              {(
                ["all", "lesson", "book", "page", "paper"] as ActivityFilter[]
              ).map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setActivityFilter(item)}
                  style={[
                    styles.filterButton,
                    activityFilter === item && styles.filterSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterText,
                      activityFilter === item && styles.filterTextSelected,
                    ]}
                  >
                    {item === "all" ? "All actions" : labelForType(item)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {loading ? (
              <View
                style={styles.skeletonList}
                accessibilityLabel="Loading activity"
              >
                {[0, 1, 2, 3].map((item) => (
                  <View key={item} style={styles.skeletonRow}>
                    <Skeleton style={styles.skeletonIcon} />
                    <View style={styles.skeletonCopy}>
                      <Skeleton style={styles.skeletonTitle} />
                      <Skeleton style={styles.skeletonLine} />
                    </View>
                    <Skeleton style={styles.skeletonDate} />
                  </View>
                ))}
              </View>
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : (
              <>
                <View style={styles.metricsGrid}>
                  <Metric
                    icon="users"
                    label="Active users"
                    value={String(metrics.uniqueUsers)}
                    color="#006EFF"
                  />
                  <Metric
                    icon="repeat"
                    label="Returning users"
                    value={String(metrics.returningUsers)}
                    color="#8B5CF6"
                  />
                  <Metric
                    icon="mouse-pointer"
                    label="Actions logged"
                    value={String(visibleEvents.length)}
                    color="#E76F51"
                  />
                  <Metric
                    icon="book-open"
                    label="Resources opened"
                    value={String(metrics.uniqueResources)}
                    color="#2A9D8F"
                  />
                  <Metric
                    icon="trending-up"
                    label="Top resource"
                    value={
                      metrics.topResources[0]
                        ? `${metrics.topResources[0][1]} opens`
                        : "No data"
                    }
                    color="#E9C46A"
                  />
                </View>
                <Text style={styles.sectionTitle}>Average actions per day</Text>
                <View style={styles.averageRow}>
                  <Average label="Daily" value={metrics.average(1)} />
                  <Average label="Weekly" value={metrics.average(7)} />
                  <Average label="Monthly" value={metrics.average(30)} />
                </View>
                <Text style={styles.sectionTitle}>Activity trend</Text>
                <View style={styles.chart}>
                  {metrics.dailyTrend.map((day) => {
                    const max = Math.max(
                      ...metrics.dailyTrend.map((entry) => entry.count),
                      1,
                    );
                    return (
                      <View key={day.label} style={styles.barColumn}>
                        <View
                          style={[
                            styles.bar,
                            { height: Math.max(4, (day.count / max) * 78) },
                          ]}
                        />
                        <Text style={styles.barLabel}>{day.label}</Text>
                        <Text style={styles.barCount}>{day.count}</Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.sectionTitle}>Most accessed resources</Text>
                {metrics.topResources.length === 0 ? (
                  <Text style={styles.empty}>
                    No resources opened in this period.
                  </Text>
                ) : (
                  metrics.topResources.map(([resourceId, count], index) => (
                    <View key={resourceId} style={styles.resourceRow}>
                      <Text style={styles.resourceRank}>{index + 1}</Text>
                      <Text style={styles.resourceId} numberOfLines={1}>
                        {resourceId}
                      </Text>
                      <Text style={styles.resourceCount}>{count} opens</Text>
                    </View>
                  ))
                )}
                <Text style={styles.sectionTitle}>Recent activity</Text>
                {visibleEvents.length === 0 ? (
                  <Text style={styles.empty}>
                    No activity events have been recorded yet.
                  </Text>
                ) : (
                  visibleEvents.slice(0, 40).map((event) => (
                    <View key={event.id} style={styles.eventRow}>
                      <View style={styles.eventIcon}>
                        <Icon
                          name={
                            event.type === "lesson"
                              ? "play-circle"
                              : event.type === "book"
                                ? "book"
                                : "file-text"
                          }
                          size={17}
                          color={colors.primary}
                        />
                      </View>
                      <View style={styles.eventCopy}>
                        <Text style={styles.eventName}>
                          {event.userName || event.userEmail || event.userId}
                        </Text>
                        <Text style={styles.eventDetail}>
                          {labelForType(event.type)} opened · {event.resourceId}
                        </Text>
                      </View>
                      <Text style={styles.eventTime}>
                        {formatTime(event.openedAt)}
                      </Text>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

function Metric({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ComponentProps<typeof Icon>["name"];
  label: string;
  value: string;
  color: string;
}) {
  return (
    <View style={styles.metric}>
      <Icon name={icon} size={19} color={color} />
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function Average({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.average}>
      <Text style={styles.averageValue}>{value}</Text>
      <Text style={styles.averageLabel}>{label}</Text>
    </View>
  );
}

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Recently";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.lightBackground },
  page: { flex: 1, alignItems: "center" },
  contentContainer: { flex: 1, width: "100%" },
  scroll: { flex: 1, width: "100%" },
  container: { paddingVertical: spacing.xxl },
  header: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  back: { padding: 6 },
  refresh: {
    marginLeft: "auto",
    padding: 10,
    backgroundColor: colors.white,
    borderRadius: radius.sm,
  },
  exportButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
  },
  exportText: { color: colors.white, fontSize: 12, fontWeight: "700" },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: { color: colors.dark, fontSize: 30, fontWeight: "800" },
  subtitle: {
    color: colors.subtitle,
    fontSize: 14,
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  rangeRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  rangeButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
  },
  rangeSelected: { backgroundColor: colors.dark, borderColor: colors.dark },
  rangeText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  rangeTextSelected: { color: colors.white },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.dark,
    fontSize: 13,
    paddingVertical: 11,
    paddingHorizontal: spacing.sm,
  },
  filterRow: { gap: spacing.sm, paddingBottom: spacing.lg },
  filterButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
  },
  filterSelected: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  filterText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  filterTextSelected: { color: colors.primaryDark },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  metric: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    minWidth: 145,
    flex: 1,
    minHeight: 112,
  },
  metricValue: {
    color: colors.dark,
    fontSize: 24,
    fontWeight: "800",
    marginTop: spacing.sm,
  },
  metricLabel: { color: colors.subtitle, fontSize: 12, marginTop: 3 },
  sectionTitle: {
    color: colors.dark,
    fontSize: 17,
    fontWeight: "800",
    marginTop: spacing.xxl,
    marginBottom: spacing.md,
  },
  averageRow: {
    flexDirection: "row",
    backgroundColor: colors.dark,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  average: {
    flex: 1,
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "#33405D",
  },
  averageValue: { color: colors.white, fontSize: 24, fontWeight: "800" },
  averageLabel: { color: "#B6C2D9", fontSize: 12, marginTop: 3 },
  chart: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    minHeight: 130,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  barColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: 104,
    flex: 1,
  },
  bar: {
    width: 18,
    maxHeight: 78,
    backgroundColor: colors.primary,
    borderRadius: 5,
    marginBottom: 5,
  },
  barLabel: {
    color: colors.subtitle,
    fontSize: 10,
    textTransform: "uppercase",
  },
  barCount: {
    color: colors.dark,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 2,
  },
  resourceRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF0F5",
  },
  resourceRank: {
    width: 24,
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },
  resourceId: { flex: 1, color: colors.dark, fontSize: 13, fontWeight: "600" },
  resourceCount: { color: colors.subtitle, fontSize: 12 },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF0F5",
  },
  eventIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.sm,
  },
  eventCopy: { flex: 1 },
  eventName: { color: colors.dark, fontSize: 13, fontWeight: "700" },
  eventDetail: { color: colors.subtitle, fontSize: 11, marginTop: 3 },
  eventTime: { color: colors.subtitle, fontSize: 11 },
  loader: { marginTop: spacing.xxl },
  skeletonList: { marginTop: spacing.lg, gap: spacing.sm },
  skeletonRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
  },
  skeletonIcon: { width: 42, height: 42, borderRadius: 21 },
  skeletonCopy: { flex: 1, gap: 8 },
  skeletonTitle: { width: "62%", height: 14 },
  skeletonLine: { width: "88%", height: 11 },
  skeletonDate: { width: 54, height: 10 },
  error: { color: "#B42318", backgroundColor: "#FEE4E2", padding: spacing.md },
  empty: {
    color: colors.subtitle,
    backgroundColor: colors.white,
    padding: spacing.lg,
  },
});
