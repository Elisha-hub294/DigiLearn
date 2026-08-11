import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
export function InterestCard({
  item,
}: {
  item: {
    name: string;
    gradient?: string[];
    "png-icon"?: string;
    avatar?: string;
  };
}) {
  const colors = item.gradient?.filter(Boolean) ?? [];
  const usesAvatar = !item["png-icon"] && Boolean(item.avatar);
  const image = item["png-icon"] || item.avatar;
  const body = (
    <>
      <Image
        source={
          image
            ? { uri: image }
            : require("../../../assets/images/subject-default.png")
        }
        style={usesAvatar ? s.avatar : s.image}
        contentFit="cover"
      />
    </>
  );
  return (
    <View
      accessible
      accessibilityLabel={`Interest: ${item.name}`}
      style={s.wrap}
    >
      {usesAvatar ? (
        <View style={s.avatarCard}>{body}</View>
      ) : (
        <LinearGradient
          colors={
            (colors.length ? colors : ["#000", "#000"]) as [string, string]
          }
          style={s.card}
        >
          {body}
        </LinearGradient>
      )}
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { width: 80 },
  card: {
    height: 80,
    borderRadius: 999,
    padding: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCard: {
    height: 80,
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  image: { width: 35, height: 35 },
  avatar: { ...StyleSheet.absoluteFill, width: "100%", height: "100%" },
  title: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 2,
    textAlign: "center",
  },
});
