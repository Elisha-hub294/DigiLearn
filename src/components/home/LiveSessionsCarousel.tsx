import { Feather as Icon } from "@expo/vector-icons";
import { useState } from "react";
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { radius, spacing } from "../../constants/theme";
import { useTheme } from "../../contexts/ThemeContext";
import { TeacherPost, TeacherPostItem } from "./TeacherPostCard";

const MAX_MEETING_CARDS = 6;

export function LiveSessionsCarousel({
  posts,
  teacherAvatars,
  ownerProfiles,
  defaultUserAvatar,
}: {
  posts: TeacherPost[];
  teacherAvatars: Record<string, string>;
  ownerProfiles: Record<string, { name: string; avatar?: string }>;
  defaultUserAvatar: string | null;
}) {
  const { width } = useWindowDimensions();
  const { colors } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);

  const meetings = posts
    .filter((post) => Boolean(post.meetCode || post.meetUrl))
    .sort((a, b) => {
      const aIsActive = a.status !== "ended" && a.isLive === true;
      const bIsActive = b.status !== "ended" && b.isLive === true;
      if (aIsActive !== bIsActive) return aIsActive ? -1 : 1;
      return (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0);
    })
    .slice(0, MAX_MEETING_CARDS);

  if (meetings.length === 0) return null;

  const cardWidth = Math.min(620, Math.max(280, width * 0.86));
  const hasMultipleCards = meetings.length > 1;

  const renderCard = (post: TeacherPost, index: number) => (
    <View style={[styles.card, { width: cardWidth }]}>
      <TeacherPostItem
        postItem={post}
        index={index}
        teacherAvatars={teacherAvatars}
        ownerProfiles={ownerProfiles}
        defaultUserAvatar={defaultUserAvatar}
        isVisible
      />
    </View>
  );

  return (
    <View style={styles.section}>
      <View style={styles.headingRow}>
        <View style={styles.headingTitleRow}>
          <Icon name="video" size={17} color={colors.primary} />
          <Text style={[styles.heading, { color: colors.text }]}>
            Live classes
          </Text>
        </View>
        <Text style={[styles.headingMeta, { color: colors.subtitle }]}>
          {meetings.length} {meetings.length === 1 ? "meeting" : "meetings"}
        </Text>
      </View>

      {hasMultipleCards ? (
        <FlatList
          data={meetings}
          horizontal
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => renderCard(item, index)}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          snapToInterval={cardWidth + spacing.md}
          decelerationRate="fast"
          onMomentumScrollEnd={(
            event: NativeSyntheticEvent<NativeScrollEvent>,
          ) => {
            setActiveIndex(
              Math.min(
                meetings.length - 1,
                Math.round(
                  event.nativeEvent.contentOffset.x / (cardWidth + spacing.md),
                ),
              ),
            );
          }}
        />
      ) : (
        renderCard(meetings[0], 0)
      )}

      {hasMultipleCards ? (
        <View
          style={styles.pagination}
          accessibilityLabel="Live class carousel pagination"
        >
          {meetings.map((meeting, index) => (
            <View
              key={meeting.id}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeIndex ? colors.primary : colors.border,
                },
                index === activeIndex && styles.activeDot,
              ]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: "100%",
    marginBottom: spacing.lg,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  headingTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
  },
  heading: {
    fontSize: 18,
    fontWeight: "800",
  },
  headingMeta: {
    fontSize: 12,
    fontWeight: "600",
  },
  listContent: {
    paddingHorizontal: spacing.xs,
  },
  separator: {
    width: spacing.md,
  },
  card: {
    overflow: "hidden",
    borderRadius: radius.md,
  },
  pagination: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    borderRadius: 3,
  },
});
