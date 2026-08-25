import { Feather as Icon } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  announcements,
  subjectColors,
  type AnnouncementItem,
} from "../constants/homeData";
import { colors, radius, shadows, spacing } from "../constants/theme";

export const AnnouncementCard = ({ item }: { item: AnnouncementItem }) => {
  if (item.variant === 2) {
    return (
      <Animated.View
        entering={FadeInUp.duration(520)}
        style={[styles.quoteCard, { backgroundColor: "#F5EDFF" }]}
      >
        <Text style={styles.quoteMark}>“</Text>
        <Text style={styles.quoteText}>{item.quote}</Text>
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.teacher}>{item.teacherName}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <View
            style={[
              styles.subjectBadge,
              { backgroundColor: subjectColors[item.subject ?? "English"] },
            ]}
          >
            <Text style={styles.subjectBadgeText}>{item.subject}</Text>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInUp.duration(520)} style={styles.card}>
      <View style={styles.imageWrap}>
        <Image
          source={item.image ?? require("../../assets/images/pdf-preview.png")}
          style={styles.image}
          contentFit="cover"
        />
        <View style={styles.overlay} />
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.footerRow}>
          <View>
            <Text style={styles.teacher}>{item.teacherName}</Text>
            <Text style={styles.time}>{item.time}</Text>
          </View>
          <Pressable
            style={styles.iconButton}
            accessibilityLabel="Open announcement"
          >
            <Icon name="arrow-right" size={14} color={colors.white} />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
};

export const AnnouncementList = () => {
  return (
    <View>
      {announcements.map((item) => (
        <AnnouncementCard key={item.id} item={item} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 22,
    overflow: "hidden",
    ...shadows.card,
    marginBottom: spacing.md,
  },
  imageWrap: { height: 140, position: "relative" },
  image: { width: "100%", height: "100%" },
  overlay: { ...StyleSheet.absoluteFill, backgroundColor: "rgba(0,0,0,0.25)" },
  content: { padding: spacing.lg },
  title: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: spacing.md,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  teacher: { color: colors.text, fontSize: 13, fontWeight: "700" },
  time: { color: colors.subtitle, fontSize: 12, marginTop: 2 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  quoteCard: {
    borderRadius: 22,
    padding: spacing.lg,
    ...shadows.card,
    marginBottom: spacing.md,
  },
  quoteMark: {
    color: colors.primary,
    fontSize: 34,
    fontWeight: "800",
    marginBottom: 4,
  },
  quoteText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "700",
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  subjectBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  subjectBadgeText: { color: colors.white, fontSize: 11, fontWeight: "700" },
});
