import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './useAuth';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('system');
  const { user } = useAuth();

  // Load theme from user settings when user is authenticated
  useEffect(() => {
    const loadTheme = async () => {
      if (!user) {
        // Use system theme as default when not logged in
        setTheme('system');
        return;
      }

      try {
        // Try to get user settings from Firestore
        const settingsDocRef = doc(db, "user_settings", user.uid);
        const settingsDoc = await getDoc(settingsDocRef);

        if (settingsDoc.exists() && settingsDoc.data().appearance?.theme) {
          setTheme(settingsDoc.data().appearance.theme);
        }
      } catch (error) {
        console.error("Error loading theme from settings:", error);
      }
    };

    loadTheme();
  }, [user]);

  // Apply theme to document
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Remove any existing theme classes
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // Check system preference
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
      root.classList.add(systemTheme);
    } else {
      // Apply selected theme
      root.classList.add(theme);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
