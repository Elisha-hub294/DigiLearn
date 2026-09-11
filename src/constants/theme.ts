import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const colors = {
  primary: "#006eff",
  primaryDark: "#003985",
  primaryRed: "#ff3c3cff",
  primaryRedDark: "#C2414B",
  primaryLight: "#DDEBFF",
  green: "#6BCB77",
  purple: "#B89AF8",
  orange: "#F4A261",
  background: "#fff",
  lightBackground: "#F8F9FC",
  text: "#414141",
  subtitle: "#777777",
  border: "#d1d1d1",
  white: "#FFFFFF",
  dark: "#00091d",
  inactive: "#6d6d6d",
  surface: "#F1F5F9",
  surfaceMuted: "#F4F6F8",
  surfaceBorder: "#E2E8F0",
  danger: "#EF4444",
  dangerBackground: "#FEE2E2",
  warning: "#946200",
  warningBackground: "#FFF8E6",
  warningBorder: "#F2D48A",
  infoBorder: "#C9DFFF",
  warmSurface: "#FFF7ED",
  warmBorder: "#FED7AA",
  warmAccent: "#EA580C",
  warmAccentBackground: "#FFEDD5",
  success: "#238636",
  successBackground: "#DCFCE7",
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
    boxShadow: "0px 10px 16px rgba(15, 23, 42, 0.2)",
    elevation: 2,
  },
  soft: {
    boxShadow: "0px 6px 10px rgba(15, 23, 42, 0.04)",
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
