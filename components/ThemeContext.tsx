import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'default' | 'winter';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: 'default', toggleTheme: () => {} });

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('default');

  useEffect(() => {
    // Apply the class to the root element to trigger CSS variable changes
    if (theme === 'winter') {
      document.documentElement.classList.add('theme-winter');
    } else {
      document.documentElement.classList.remove('theme-winter');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'default' ? 'winter' : 'default');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};