import { Image } from "expo-image";
import { StyleSheet } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

export const FooterImage = () => (
  <Animated.View entering={FadeInUp.duration(600)} style={styles.container}>
    <Image
      source={require("../../assets/images/footer-home.png")}
      style={styles.image}
      contentFit="contain"
    />
  </Animated.View>
);

const styles = StyleSheet.create({
  container: { alignItems: "center", marginTop: 8, marginBottom: 24 },
  image: { width: "100%", maxWidth: 360, height: 140 },
});
