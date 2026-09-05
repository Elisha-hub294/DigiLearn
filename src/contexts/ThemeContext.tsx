import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SystemUI from "expo-system-ui";
import React, { createContext, useContext, useEffect, useState } from "react";
import { Appearance } from "react-native";
import { colors as lightColors } from "../constants/theme";

const THEME_STORAGE_KEY = "digilearn-theme";

const darkColors = {
  ...lightColors,
  background: "#101827",
  lightBackground: "#172235",
  primaryLight: "#19345A",
  text: "#E5E7EB",
  subtitle: "#AAB4C3",
  border: "#334155",
  white: "#1D2939",
  dark: "#F8FAFC",
  inactive: "#94A3B8",
} as const;

export type ThemeMode = "light" | "dark";
export type ThemeColors = {
  [Key in keyof typeof lightColors]: string;
};

type ThemeContextValue = {
  isDark: boolean;
  isHydrated: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ThemeMode>("light");
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadTheme = async () => {
      try {
        const storedMode = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (cancelled) return;

        if (storedMode === "light" || storedMode === "dark") {
          setMode(storedMode);
        } else {
          setMode(Appearance.getColorScheme() === "dark" ? "dark" : "light");
        }
      } catch (error) {
        console.error("Unable to load theme preference:", error);
        if (!cancelled) {
          setMode(Appearance.getColorScheme() === "dark" ? "dark" : "light");
        }
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    };
    void loadTheme();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    void SystemUI.setBackgroundColorAsync(
      mode === "dark" ? darkColors.background : lightColors.background,
    );
  }, [isHydrated, mode]);

  const setThemeMode = async (nextMode: ThemeMode) => {
    const previousMode = mode;
    setMode(nextMode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (error) {
      setMode(previousMode);
      console.error("Unable to save theme preference:", error);
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        isDark: mode === "dark",
        isHydrated,
        colors: mode === "dark" ? darkColors : lightColors,
        setThemeMode,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
