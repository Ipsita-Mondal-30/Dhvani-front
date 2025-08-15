import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    primary: string;
    text: string;
    textSecondary: string;
    border: string;
    card: string;
  };
}

const lightColors = {
  background: '#F9FAFB',
  surface: '#FFFFFF',
  primary: '#3B82F6',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
  card: '#FFFFFF',
};

const darkColors = {
  background: '#0F172A',
  surface: '#1E293B',
  primary: '#3B82F6',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  border: '#334155',
  card: '#1E293B',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('dark'); // Default to dark

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('app-theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
      }
    } catch (error) {
      console.error('Error loading theme:', error);
    }
  };

  const toggleTheme = async () => {
    try {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      await AsyncStorage.setItem('app-theme', newTheme);
    } catch (error) {
      console.error('Error saving theme:', error);
    }
  };

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    colors: theme === 'dark' ? darkColors : lightColors,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};