import React, { createContext, useContext, useState } from 'react';

interface QuizBackgroundContextType {
  backgroundTheme: string;
  customBackground: string | null;
  setQuizBackground: (theme: string, custom?: string | null) => void;
  getBackgroundStyle: () => React.CSSProperties;
  resetBackground: () => void;
}

const QuizBackgroundContext = createContext<QuizBackgroundContextType | undefined>(undefined);

export function useQuizBackground() {
  const context = useContext(QuizBackgroundContext);
  if (!context) {
    throw new Error('useQuizBackground must be used within a QuizBackgroundProvider');
  }
  return context;
}

export function QuizBackgroundProvider({ children }: { children: React.ReactNode }) {
  const [backgroundTheme, setBackgroundTheme] = useState('bg-sky-600');
  const [customBackground, setCustomBackground] = useState<string | null>(null);

  const setQuizBackground = (theme: string, custom?: string | null) => {
    setBackgroundTheme(theme);
    setCustomBackground(custom || null);
  };

  const getBackgroundStyle = (): React.CSSProperties => {
    if (customBackground) {
      return {
        backgroundImage: `linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url(${customBackground})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      };
    }
    
    // Default classroom style for preset themes
    return {
      backgroundImage: 'linear-gradient(rgba(0,0,0,0.1), rgba(0,0,0,0.1)), url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 1200 800\'%3E%3Cdefs%3E%3ClinearGradient id=\'classroom\' x1=\'0%25\' y1=\'0%25\' x2=\'100%25\' y2=\'100%25\'%3E%3Cstop offset=\'0%25\' style=\'stop-color:%23a8d5ba;stop-opacity:1\' /%3E%3Cstop offset=\'50%25\' style=\'stop-color:%2398c7a8;stop-opacity:1\' /%3E%3Cstop offset=\'100%25\' style=\'stop-color:%2385c7a1;stop-opacity:1\' /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width=\'100%25\' height=\'100%25\' fill=\'url(%23classroom)\'/%3E%3C/svg%3E")',
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    };
  };

  const resetBackground = () => {
    setBackgroundTheme('bg-sky-600');
    setCustomBackground(null);
  };

  return (
    <QuizBackgroundContext.Provider value={{
      backgroundTheme,
      customBackground,
      setQuizBackground,
      getBackgroundStyle,
      resetBackground
    }}>
      {children}
    </QuizBackgroundContext.Provider>
  );
}