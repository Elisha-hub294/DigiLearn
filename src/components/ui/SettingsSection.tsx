import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { useTheme } from "../../contexts/ThemeContext";

type SettingsSectionProps = {
  children: React.ReactNode;
  style?: ViewProps["style"];
};

export function SettingsSection({ children, style }: SettingsSectionProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.white, borderColor: colors.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
});

export default SettingsSection;
