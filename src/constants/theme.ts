import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const colors = {
  primary: "#006eff",
  primaryDark: "#003985",
  primaryLight: "#DDEBFF",
  green: "#6BCB77",
  purple: "#B89AF8",
  orange: "#F4A261",
  background: "#fff",
  lightBackground: "#F8F9FC",
  text: "#414141",
  subtitle: "#777777",
  border: "#D9D9D9",
  white: "#FFFFFF",
  dark: "#00091d",
  inactive: "#6d6d6d",
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const shadows = {
  card: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 2,
  },
  soft: {
    shadowColor: "#0F172A",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
} as const;

export const typography = {
  title: { fontSize: width >= 768 ? 28 : 24, fontWeight: "700" as const },
  subtitle: { fontSize: width >= 768 ? 16 : 14, fontWeight: "500" as const },
  body: { fontSize: width >= 768 ? 15 : 13, fontWeight: "400" as const },
  heading: { fontSize: width >= 768 ? 20 : 18, fontWeight: "700" as const },
};

export const dimensions = {
  width,
  height,
  // Max content width to prevent stretching on large screens
  maxContentWidth: Math.min(1000, width - 20),
};
