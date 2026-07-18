import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const colors = {
  primary: "#3B82F6",
  primaryLight: "#DDEBFF",
  green: "#6BCB77",
  purple: "#B89AF8",
  orange: "#F4A261",
  background: "#EAEAEA",
  lightBackground: "#F8F9FC",
  text: "#222222",
  subtitle: "#777777",
  border: "#D9D9D9",
  white: "#FFFFFF",
  dark: "#111827",
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
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 4,
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
  // Responsive horizontal padding: small phones ~14, medium ~20, tablets 36
  screenPaddingHorizontal:
    width >= 1024 ? 48 : width >= 768 ? 32 : width >= 400 ? 20 : 14,
  // Max content width to prevent stretching on large screens
  maxContentWidth: Math.min(1000, width - 20),
};
