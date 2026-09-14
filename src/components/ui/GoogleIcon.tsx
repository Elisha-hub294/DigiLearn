import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

interface GoogleIconProps {
  size?: number;
}

export function GoogleIcon({ size = 20 }: GoogleIconProps) {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image
        source={require("../../../assets/images/google-logo.png")}
        style={{ width: size, height: size }}
        contentFit="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: "center",
    alignItems: "center",
  },
});
