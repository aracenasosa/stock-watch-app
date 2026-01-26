import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';

const THEME_KEY = 'theme_preference';

type Theme = 'light' | 'dark';

interface ThemeColors {
  // Backgrounds
  background: string;
  surface: string;
  surfaceElevated: string;
  
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Accents
  primary: string;
  primaryLight: string;
  
  // Status
  success: string;
  successLight: string;
  danger: string;
  dangerLight: string;
  warning: string;
  
  // Borders
  border: string;
  borderLight: string;
  
  // Tab bar
  tabBar: string;
  tabBarBorder: string;
  tabActive: string;
  tabInactive: string;
}

const lightColors: ThemeColors = {
  background: '#F5F5F7',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  
  text: '#1C1C1E',
  textSecondary: '#3A3A3C',
  textMuted: '#8E8E93',
  
  primary: '#007AFF',
  primaryLight: '#E3F2FF',
  
  success: '#34C759',
  successLight: '#E8F9ED',
  danger: '#FF3B30',
  dangerLight: '#FFECEB',
  warning: '#FF9500',
  
  border: '#E5E5EA',
  borderLight: '#F2F2F7',
  
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E5EA',
  tabActive: '#007AFF',
  tabInactive: '#8E8E93',
};

const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#1C1C1E',
  surfaceElevated: '#2C2C2E',
  
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textMuted: '#8E8E93',
  
  primary: '#0A84FF',
  primaryLight: '#1C3A5F',
  
  success: '#30D158',
  successLight: '#0D3D1F',
  danger: '#FF453A',
  dangerLight: '#3D1512',
  warning: '#FF9F0A',
  
  border: '#38383A',
  borderLight: '#2C2C2E',
  
  tabBar: '#1C1C1E',
  tabBarBorder: '#38383A',
  tabActive: '#0A84FF',
  tabInactive: '#8E8E93',
};

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((saved: string | null) => {
      if (saved === 'light' || saved === 'dark') {
        setThemeState(saved);
      } else if (systemColorScheme) {
        setThemeState(systemColorScheme);
      }
      setIsLoaded(true);
    });
  }, [systemColorScheme]);

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem(THEME_KEY, newTheme);
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const value: ThemeContextType = {
    theme,
    isDark: theme === 'dark',
    colors: theme === 'dark' ? darkColors : lightColors,
    toggleTheme,
    setTheme,
  };

  // Don't render until theme is loaded to avoid flash
  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export type { ThemeColors, Theme };
