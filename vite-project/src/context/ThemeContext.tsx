// ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type AccentColor = 'blue' | 'green' | 'purple' | 'red' | 'orange' | 'teal' | 'pink' | 'indigo';

interface ThemeContextType {
  theme: Theme;
  accentColor: AccentColor;
  toggleTheme: (theme: Theme) => void;
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
      return 'system';
    }
    return 'system';
  });

  // Function to get the effective theme based on system preference
  const getEffectiveTheme = (themeSetting: Theme): 'light' | 'dark' => {
    if (themeSetting === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeSetting;
  };

  const [accentColor, setAccentColor] = useState<AccentColor>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('accentColor') as AccentColor) || 'blue';
    }
    return 'blue';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Get the effective theme (actual light/dark value)
    const effectiveTheme = getEffectiveTheme(theme);
    
    // Apply theme
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveTheme);
    
    // Apply only primary accent color, let shadcn handle the rest
    const colors = ACCENT_COLORS[accentColor];
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    
    // Save to localStorage
    localStorage.setItem('theme', theme);
    localStorage.setItem('accentColor', accentColor);

    // Listen for system theme changes if using system theme
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, accentColor]);

  const toggleTheme = (newTheme: Theme) => {
    setTheme(newTheme);
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
