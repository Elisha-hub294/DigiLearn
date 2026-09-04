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
import { useTheme } from "../../contexts/ThemeContext";

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
  const { colors } = useTheme();
  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: colors.white },
          pressed && { backgroundColor: colors.lightBackground },
          style,
        ]}
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
          style={[
            styles.title,
            { color: destructive ? "#FF4D4D" : colors.dark },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <View style={styles.right}>{right}</View>
      </Pressable>
      {showSeparator ? (
        <View style={[styles.separator, { backgroundColor: colors.border }]} />
      ) : null}
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
  },
  left: { width: 28, alignItems: "center", marginRight: 12 },
  title: { flex: 1, fontSize: 14 },
  right: { marginLeft: 12 },
  separator: { height: 1, marginLeft: 58 },
});

export default SettingsRow;
