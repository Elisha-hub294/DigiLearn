import { FirebaseImage as Image } from "@/components/ui/FirebaseImage";
import { useState } from "react";
import {
  DimensionValue,
  ImageSourcePropType,
  LayoutChangeEvent,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  ViewStyle,
} from "react-native";
import { radius, spacing } from "../../constants/theme";
import { getThemeAsset } from "../../constants/themeAssets";
import { useTheme } from "../../contexts/ThemeContext";
import { ResourceDeleteMenu } from "../ui/ResourceDeleteMenu";

type BookCardItem = {
  id: string;
  title: string;
  author: string;
  description: string;
  image?: ImageSourcePropType | string | null;
  progress?: number;
  owner?: string;
};

type BookCardProps = {
  item: BookCardItem;
  onPress?: () => void;
  width?: DimensionValue;
  marginRight?: number;
  style?: StyleProp<ViewStyle>;
};

export function BookCard({
  item,
  onPress,
  width = 200,
  marginRight = spacing.md,
  style,
}: BookCardProps) {
  const { colors, isDark } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const fallbackCover = getThemeAsset("bookCoverDefault", isDark);
  const [cardWidth, setCardWidth] = useState(0);
  const [coverRatio, setCoverRatio] = useState<number | null>(null);

  const handleCardLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    if (nextWidth > 0 && nextWidth !== cardWidth) setCardWidth(nextWidth);
  };
  const responsiveWidth =
    cardWidth || (typeof width === "number" ? width : screenWidth * 0.9);
  const coverOrientation =
    coverRatio === null
      ? "unknown"
      : coverRatio >= 1
        ? "landscape"
        : "portrait";
  const imageHeight =
    coverOrientation === "portrait"
      ? Math.min(420, Math.max(260, responsiveWidth / 0.72))
      : coverOrientation === "landscape"
        ? Math.min(300, Math.max(160, responsiveWidth * 0.52))
        : Math.min(340, Math.max(210, responsiveWidth * 0.65));
  const imageFrameStyle = [styles.imageFrame, { height: imageHeight }];

  return (
    <View
      onLayout={handleCardLayout}
      style={[
        styles.card,
        {
          width,
          marginRight,
          backgroundColor: colors.white,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        style={({ pressed, hovered }) => [
          styles.cardContent,
          hovered && styles.hovered,
          pressed && styles.pressed,
        ]}
        onPress={onPress}
      >
        <View style={imageFrameStyle}>
          <Image
            source={item.image || fallbackCover}
            style={styles.image}
            contentFit="contain"
            onLoad={(event) => {
              const { width: imageWidth, height: imageHeight } = event.source;
              const nextRatio = imageWidth / imageHeight;
              setCoverRatio((current) =>
                current === nextRatio ? current : nextRatio,
              );
            }}
          />
        </View>
        <View style={styles.content}>
          {item.badge || typeof item.progress === "number" ? (
            <View style={styles.badgeRow}>
              {item.badge ? (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.primaryLight },
                  ]}
                >
                  <Text style={[styles.badgeText, { color: colors.primary }]}>
                    {item.badge}
                  </Text>
                </View>
              ) : null}
              {typeof item.progress === "number" ? (
                <View
                  style={[
                    styles.progressLabel,
                    { backgroundColor: colors.lightBackground },
                  ]}
                >
                  <Text
                    style={[styles.progressText, { color: colors.primary }]}
                  >
                    {item.progress}%
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={2}
          >
            {item.title}
          </Text>
          <Text style={[styles.author, { color: colors.subtitle }]}>
            {item.author}
          </Text>
          <Text
            style={[styles.description, { color: colors.subtitle }]}
            numberOfLines={2}
          >
            {item.description}
          </Text>
        </View>
      </Pressable>
      <View style={styles.menu}>
        <ResourceDeleteMenu
          collection="books"
          id={item.id}
          title={item.title}
          data={{ owner: item.owner, cover: item.image }}
          light
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.sm,
    overflow: "hidden",
    marginBottom: spacing.md,
    position: "relative",
    borderWidth: 1,
  },
  cardContent: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  hovered: {
    opacity: 0.98,
    transform: [{ scale: 1.01 }],
  },
  pressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  menu: { position: "absolute", top: 6, right: 6, zIndex: 2 },
  imageFrame: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  badge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  progressLabel: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  progressText: {
    fontSize: 10,
    fontWeight: "700",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  author: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: 11,
    lineHeight: 17,
  },
});
