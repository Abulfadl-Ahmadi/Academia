import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';
type AccentColor = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'teal' | 'pink' | 'indigo';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  toggleTheme: () => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const ACCENT_COLORS = {
  blue: {
    primary: 'hsl(221.2 83.2% 53.3%)',
    primaryForeground: 'hsl(210 40% 98%)',
  },
  green: {
    primary: 'hsl(142.1 76.2% 36.3%)',
    primaryForeground: 'hsl(355.7 100% 97.3%)',
  },
  purple: {
    primary: 'hsl(262.1 83.3% 57.8%)',
    primaryForeground: 'hsl(210 40% 98%)',
  },
  red: {
    primary: 'hsl(0 84.2% 60.2%)',
    primaryForeground: 'hsl(210 40% 98%)',
  },
  orange: {
    primary: 'hsl(24.6 95% 53.1%)',
    primaryForeground: 'hsl(60 9.1% 97.8%)',
  },
  teal: {
    primary: 'hsl(173 58% 39%)',
    primaryForeground: 'hsl(210 40% 98%)',
  },
  pink: {
    primary: 'hsl(346.8 77.2% 49.8%)',
    primaryForeground: 'hsl(355.7 100% 97.3%)',
  },
  indigo: {
    primary: 'hsl(221.2 83.2% 53.3%)',
    primaryForeground: 'hsl(210 40% 98%)',
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme') as Theme;
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('accentColor') as AccentColor) || 'blue';
    }
    return 'blue';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    // Apply only primary accent color, let shadcn handle the rest
    const colors = ACCENT_COLORS[accentColor];
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('accentColor', accentColor);
  }, [theme, accentColor]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const handleAccentColorChange = (color: AccentColor) => {
    setAccentColor(color);
  };

  return (
    <ThemeContext.Provider value={{
      theme,
      accentColor,
      toggleTheme,
      setAccentColor: handleAccentColorChange,
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
