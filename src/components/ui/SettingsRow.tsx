import { Feather as Icon } from "@expo/vector-icons";
import React from "react";
import {
    Pressable,
    StyleProp,
    StyleSheet,
    Text,
    View,
    ViewStyle,
} from "react-native";
import { colors } from "../../constants/theme";

type SettingsRowProps = {
  icon?: React.ComponentProps<typeof Icon>["name"];
  title: string;
  right?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  style?: StyleProp<ViewStyle>;
  showSeparator?: boolean;
  accessibilityLabel?: string;
};

export function SettingsRow({
  icon,
  title,
  right,
  onPress,
  destructive = false,
  style,
  showSeparator = true,
  accessibilityLabel,
}: SettingsRowProps) {
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={accessibilityLabel ?? title}
      >
        <View style={styles.left}>
          {icon ? (
            <Icon
              name={icon as any}
              size={20}
              color={destructive ? "#FF4D4D" : colors.text}
            />
          ) : null}
        </View>
        <Text
          style={[styles.title, destructive && { color: "#FF4D4D" }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={styles.right}>{right}</View>
      </Pressable>
      {showSeparator ? <View style={styles.separator} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 48,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    backgroundColor: colors.white,
  },
  left: { width: 28, alignItems: "center", marginRight: 12 },
  title: { flex: 1, fontSize: 14, color: colors.dark },
  right: { marginLeft: 12 },
  separator: { height: 1, backgroundColor: "#E5E5E5", marginLeft: 58 },
  pressed: { backgroundColor: "#F6F6F6" },
});

export default SettingsRow;
