import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_KEY = '@sindi_theme';

export type ThemeMode = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  border: string;
  borderLight: string;
  accent: string;
  accentText: string;
  cardBg: string;
  headerBg: string;
  tabBarBg: string;
  statusBarStyle: 'dark' | 'light';
  dangerBg: string;
  dangerText: string;
  successBg: string;
  successText: string;
  warningBg: string;
  warningText: string;
}

const lightTheme: ThemeColors = {
  background: '#F5F5F7',
  surface: '#ffffff',
  surfaceAlt: '#f8fafc',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  accent: '#FFD600',
  accentText: '#0F172A',
  cardBg: '#ffffff',
  headerBg: '#ffffff',
  tabBarBg: '#ffffff',
  statusBarStyle: 'dark',
  dangerBg: '#fef2f2',
  dangerText: '#dc2626',
  successBg: '#f0fdf4',
  successText: '#16a34a',
  warningBg: '#fefce8',
  warningText: '#a16207',
};

const darkTheme: ThemeColors = {
  background: '#0F172A',
  surface: '#1e293b',
  surfaceAlt: '#1a2332',
  text: '#f1f5f9',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  border: '#334155',
  borderLight: '#1e293b',
  accent: '#FFD600',
  accentText: '#0F172A',
  cardBg: '#1e293b',
  headerBg: '#0F172A',
  tabBarBg: '#0F172A',
  statusBarStyle: 'light',
  dangerBg: '#450a0a',
  dangerText: '#fca5a5',
  successBg: '#052e16',
  successText: '#86efac',
  warningBg: '#422006',
  warningText: '#fde68a',
};

interface ThemeContextType {
  theme: ThemeMode;
  colors: ThemeColors;
  toggleTheme: () => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'light',
  colors: lightTheme,
  toggleTheme: () => {},
  isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>('light');

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then(saved => {
      if (saved === 'dark') setTheme('dark');
    });
  }, []);

  const toggleTheme = async () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  };

  const colors = theme === 'dark' ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, isDark: theme === 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
