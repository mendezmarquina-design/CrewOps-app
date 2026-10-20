// src/context/ThemeContext.jsx
import React, { createContext, useContext, useEffect } from 'react';
import { useTheme } from '../hooks/useTheme';
import { themeStyles } from '../config/themes';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [currentTheme, setCurrentTheme] = useTheme();
  const theme = themeStyles[currentTheme] || themeStyles.cyberpunk;

  // Actualiza el atributo data-theme en el <html> para activar las variables CSS
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
  }, [currentTheme]);

  return (
    <ThemeContext.Provider value={{ currentTheme, setCurrentTheme, theme }}>
      {/* Usamos bg-bgApp (variable de Tailwind v4) en lugar de un theme.bgMain hardcoded */}
      <div className="min-h-screen bg-bgApp text-main transition-colors duration-200">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

export const useAppTheme = () => useContext(ThemeContext);