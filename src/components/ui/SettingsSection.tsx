import React from "react";
import { StyleSheet, View, ViewProps } from "react-native";
import { colors } from "../../constants/theme";

type SettingsSectionProps = {
  children: React.ReactNode;
  style?: ViewProps["style"];
};

export function SettingsSection({ children, style }: SettingsSectionProps) {
  return <View style={[styles.container, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    borderColor: "#DDDDDD",
    borderWidth: 1,
    borderRadius: 12,
    overflow: "hidden",
  },
});

export default SettingsSection;
