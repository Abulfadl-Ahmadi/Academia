import React, { createContext, useContext, useEffect, useState } from 'react';

type FontFamily = 'IRANSansX' | 'Ravi';

interface FontContextType {
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('fontFamily') as FontFamily) || 'IRANSansX';
    }
    return 'IRANSansX';
  });

  useEffect(() => {
    const root = document.documentElement;
    
    // Apply font family
    root.classList.remove('font-iransansx', 'font-ravi');
    root.classList.add(`font-${fontFamily.toLowerCase()}`);
    
    // Save to localStorage
    localStorage.setItem('fontFamily', fontFamily);
  }, [fontFamily]);

  const handleFontFamilyChange = (font: FontFamily) => {
    setFontFamily(font);
  };

  return (
    <FontContext.Provider value={{
      fontFamily,
      setFontFamily: handleFontFamilyChange,
    }}>
      {children}
    </FontContext.Provider>
  );
}

export function useFont() {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
}