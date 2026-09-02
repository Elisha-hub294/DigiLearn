import { Feather as Icon } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  type TextStyle,
  View,
  type ViewStyle,
} from "react-native";
import { colors, spacing } from "../constants/theme";

const publishOptions = [
  {
    title: "Publish page",
    description: "Share a new study page with learners",
    icon: "file-text" as const,
    color: "#3F7BEB",
    route: "page",
  },
  {
    title: "Add Past paper",
    description: "Upload an exam paper for revision",
    icon: "file" as const,
    color: "#12A594",
    route: "paper",
  },
  {
    title: "Announcement",
    description: "Keep the learning community informed",
    icon: "bell" as const,
    color: "#E58A18",
    route: "banner",
  },
  {
    title: "Book",
    description: "Add a recommended book to the library",
    icon: "book-open" as const,
    color: "#D14B8F",
    route: "book",
  },
  {
    title: "Add Video Lesson",
    description: "Publish a lesson learners can watch",
    icon: "play-circle" as const,
    color: "#6B58D3",
    route: "video",
  },
];

export default function PublishScreen() {
  const router = useRouter();

  const openComposer = (route: string) => {
    if (route === "page") {
      router.push("/add-page" as never);
      return;
    }
    if (route === "paper") {
      router.push("/add-paper" as never);
      return;
    }
    if (route === "book") {
      router.push("/add-book" as never);
      return;
    }
    if (route === "banner") {
      router.push("/add-banner" as never);
      return;
    }
    if (route === "video") {
      router.push("/add-trending-lesson");
      return;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Icon name="arrow-left" size={21} color={colors.text} />
          </Pressable>
          <View>
            <Text style={styles.title}>Post on DigiLearn</Text>
          </View>
        </View>

        <LinearGradient
          colors={["#102F70", "#2459B8"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.intro}
        >
          <View style={styles.introIcon}>
            <Icon name="send" size={22} color="#FFFFFF" />
          </View>
          <View style={styles.introCopy}>
            <Text style={styles.introTitle}>
              Share with the learning community
            </Text>
            <Text style={styles.introText}>
              Pick a format below to publish a page, paper, lesson,
              announcement, or book.
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.list}>
          {publishOptions.map((option, index) => (
            <Pressable
              key={option.route}
              accessibilityRole="button"
              accessibilityLabel={option.title}
              onPress={() => openComposer(option.route)}
              style={({ pressed, hovered }) => [
                styles.option,
                pressed && styles.optionPressed,
                hovered && styles.optionHovered,
              ]}
            >
              <View
                style={[
                  styles.optionIcon,
                  { backgroundColor: `${option.color}18` },
                ]}
              >
                <Icon name={option.icon} size={23} color={option.color} />
              </View>
              <View style={styles.optionCopy}>
                <Text style={styles.optionTitle}>{option.title}</Text>
                <Text style={styles.optionDescription}>
                  {option.description}
                </Text>
              </View>
              <Icon name="chevron-right" size={20} color="#94A3B8" />
              {index < publishOptions.length - 1 && (
                <View style={styles.divider} />
              )}
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type PublishStyles = {
  safe: ViewStyle;
  content: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  eyebrow: TextStyle;
  title: TextStyle;
  intro: ViewStyle;
  introIcon: ViewStyle;
  introCopy: ViewStyle;
  introTitle: TextStyle;
  introText: TextStyle;
  list: ViewStyle;
  option: ViewStyle;
  optionPressed: ViewStyle;
  optionHovered: ViewStyle;
  optionIcon: ViewStyle;
  optionCopy: ViewStyle;
  optionTitle: TextStyle;
  optionDescription: TextStyle;
  divider: ViewStyle;
};

const styles = StyleSheet.create<PublishStyles>({
  safe: { flex: 1, backgroundColor: "#F7F9FC" },
  content: {
    width: "100%",
    maxWidth: 760,
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 24,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E6EBF2",
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.8,
    marginBottom: 4,
  },
  title: { color: colors.text, fontSize: 25, fontWeight: "800", maxWidth: 310 },
  intro: {
    borderRadius: 20,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },
  introIcon: {
    width: 46,
    height: 46,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  introCopy: { flex: 1 },
  introTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  introText: { color: "#D9E7FF", fontSize: 13, lineHeight: 19, marginTop: 4 },
  list: {
    backgroundColor: colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E6EBF2",
    overflow: "hidden",
  },
  option: {
    minHeight: 86,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    borderLeftWidth: 3,
    borderLeftColor: "#ffffff",
  },
  optionPressed: { backgroundColor: "#F4F7FB" },
  optionHovered: {
    backgroundColor: "#EEF4FF",
    borderLeftWidth: 3,
    borderLeftColor: "#3F7BEB",
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  optionCopy: { flex: 1, paddingRight: 12 },
  optionTitle: { color: colors.text, fontSize: 16, fontWeight: "700" },
  optionDescription: { color: colors.subtitle, fontSize: 13, marginTop: 4 },
  divider: {
    position: "absolute",
    left: 78,
    right: 16,
    bottom: 0,
    height: 1,
    backgroundColor: "#EDF1F6",
  },
});
