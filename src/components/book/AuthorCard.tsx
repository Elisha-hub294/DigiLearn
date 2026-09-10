import { Image } from "expo-image";
import { Pressable, StyleSheet, Text } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

type AuthorCardProps = {
  name: string;
  avatar?: string;
  index: number;
  onPress?: () => void;
};

export function AuthorCard({ name, avatar, index, onPress }: AuthorCardProps) {
  return (
    <Animated.View
      entering={FadeInUp.delay(index * 70).duration(300)}
      style={styles.card}
    >
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={onPress ? `Open ${name}'s profile` : name}
      >
        <Image
          source={avatar ? { uri: avatar } : undefined}
          style={styles.avatar}
          contentFit="cover"
        />
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: { width: 82, alignItems: "center", marginRight: 18 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#E8EDF0",
  },
  name: {
    color: "#44515A",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },
});
