import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { videoColors } from "./videoDesign";

function resolveImageSource(source?: number | string) {
  if (!source) {
    return require("../../../assets/images/tr-default.png");
  }
  if (typeof source === "string") {
    return { uri: source };
  }
  return source;
}

export function TeacherInfo({
  name,
  uploadedAt,
  avatar,
}: {
  name: string;
  uploadedAt: string;
  avatar?: number | string;
}) {
  return (
    <Animated.View entering={FadeIn.duration(360)} style={styles.row}>
      <Image
        source={resolveImageSource(avatar)}
        style={styles.avatar}
        contentFit="cover"
        transition={180}
      />
      <View style={styles.copy}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={styles.name}>
            {name}
          </Text>
          <Ionicons name="checkmark-circle" size={15} color="#3B82F6" />
        </View>
        <Text style={styles.time}>{uploadedAt}</Text>
      </View>
      <Pressable
        accessibilityLabel={`More options for ${name}`}
        hitSlop={10}
        style={styles.more}
      >
        <MaterialCommunityIcons
          name="dots-vertical"
          size={24}
          color={videoColors.muted}
        />
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  row: { alignItems: "center", flexDirection: "row", marginTop: 13 },
  avatar: { backgroundColor: "#eee", borderRadius: 24, height: 30, width: 30 },
  copy: { flex: 1, marginLeft: 11 },
  nameRow: { alignItems: "center", flexDirection: "row", gap: 4 },
  name: {
    color: videoColors.ink,
    fontSize: 14,
    fontWeight: "700",
    maxWidth: 220,
  },
  time: { color: videoColors.muted, fontSize: 13, marginTop: 2 },
  more: { paddingLeft: 12 },
});
