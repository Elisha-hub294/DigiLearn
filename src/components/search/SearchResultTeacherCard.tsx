import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SearchResult } from "../../hooks/useGlobalSearch";

type SearchResultTeacherCardProps = {
  item: SearchResult;
  query: string;
  onPress: (item: SearchResult) => void;
};

const DEFAULT_TEACHER_AVATAR =
  "https://phgtiaffpozgzjxyruhg.supabase.co/storage/v1/object/public/TeacherProfile/opero-stephen.jpeg";

export function SearchResultTeacherCard({
  item,
  query,
  onPress,
}: SearchResultTeacherCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const renderName = () => {
    const name = item.title || item.teacher || "Teacher";
    const trimmedQ = query.trim();

    if (!trimmedQ || trimmedQ.length < 2) {
      return <Text style={styles.nameText}>{name}</Text>;
    }

    try {
      const escaped = trimmedQ.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const regex = new RegExp(`(${escaped})`, "gi");
      const parts = name.split(regex);

      return (
        <Text style={styles.nameText}>
          {parts.map((part, idx) => {
            const isMatch = part.toLowerCase() === trimmedQ.toLowerCase();
            return (
              <Text
                key={idx}
                style={isMatch ? styles.highlightText : undefined}
              >
                {part}
              </Text>
            );
          })}
        </Text>
      );
    } catch {
      return <Text style={styles.nameText}>{name}</Text>;
    }
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Teacher profile: ${item.title}`}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={() => onPress(item)}
          style={styles.cardPressable}
        >
          {/* Left: Large circular avatar (64px) */}
          <View style={styles.avatarWrapper}>
            <Image
              source={{
                uri: item.rawItem?.avatar || DEFAULT_TEACHER_AVATAR,
              }}
              style={styles.avatar}
              contentFit="cover"
              transition={200}
            />
          </View>

          {/* Center: Name with black pill background + 2-line bio */}
          <View style={styles.centerInfo}>
            <View style={styles.namePill}>{renderName()}</View>
            <Text style={styles.bioText} numberOfLines={2}>
              {item.description || `${item.subtitle || "Teacher"} at DigiLearn`}
            </Text>
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    height: 78,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardPressable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#F3F4F6",
  },
  avatar: {
    width: "100%",
    height: "100%",
  },
  centerInfo: {
    flex: 1,
    justifyContent: "center",
    gap: 4,
  },
  namePill: {
    alignSelf: "flex-start",
    backgroundColor: "#000000",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 14,
  },
  nameText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  highlightText: {
    color: "#60A5FA",
    fontWeight: "700",
  },
  bioText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#666666",
    lineHeight: 16,
  },
});
