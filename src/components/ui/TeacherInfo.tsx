import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { getTeacherAvatar } from "../../constants/teacherAvatar";
import { useTheme } from "../../contexts/ThemeContext";
import { FirebaseImage } from "./FirebaseImage";
// import { videoColors } from "./videoDesign";

export function TeacherInfo({
  name,
  uploadedAt,
  onPress,
}: {
  name: string;
  uploadedAt: string;
  onPress?: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(360)} style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Open teacher profile: ${name}`}
        onPress={onPress}
        disabled={!onPress}
        hitSlop={8}
      >
        <FirebaseImage
          source={{ uri: getTeacherAvatar(name) }}
          style={[styles.avatar, { backgroundColor: colors.lightBackground }]}
          contentFit="cover"
          transition={180}
        />
      </Pressable>
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Open teacher profile: ${name}`}
            onPress={onPress}
            disabled={!onPress}
            hitSlop={8}
          >
            <Text
              numberOfLines={1}
              style={[styles.name, { color: colors.text }]}
            >
              {name}
            </Text>
          </Pressable>
          {/* <Ionicons name="checkmark-circle" size={15} color="#3B82F6" /> */}
        </View>
        <Text style={[styles.time, { color: colors.inactive }]}>
          {uploadedAt}
        </Text>
      </View>
      <Pressable
        accessibilityLabel={`More options for ${name}`}
        hitSlop={10}
        style={styles.more}
      ></Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", marginTop: 13 },
  avatar: { borderRadius: 24, height: 30, width: 30 },
  copy: { flex: 1, marginLeft: 11 },
  nameRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  name: {
    fontSize: 14,
    fontWeight: "500",
    maxWidth: 220,
  },
  time: { fontSize: 13 },
  more: { paddingLeft: 12 },
});
