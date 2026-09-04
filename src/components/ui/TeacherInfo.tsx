import { colors } from "@/constants/theme";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { getTeacherAvatar } from "../../constants/teacherAvatar";
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
          style={styles.avatar}
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
            <Text numberOfLines={1} style={styles.name}>
              {name}
            </Text>
          </Pressable>
          {/* <Ionicons name="checkmark-circle" size={15} color="#3B82F6" /> */}
        </View>
        <Text style={styles.time}>{uploadedAt}</Text>
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
  avatar: { backgroundColor: "#eee", borderRadius: 24, height: 30, width: 30 },
  copy: { flex: 1, marginLeft: 11 },
  nameRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  name: {
    color: colors.dark,
    fontSize: 14,
    fontWeight: "500",
    maxWidth: 220,
  },
  time: { color: colors.inactive, fontSize: 13 },
  more: { paddingLeft: 12 },
});
