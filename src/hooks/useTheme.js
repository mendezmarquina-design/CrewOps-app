// src/hooks/useTheme.js
import { useState, useEffect } from 'react';

export function useTheme() {
  // Temas disponibles: 'cyberpunk' (tu actual), 'dark-corp', 'light-corp'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('app-theme') || 'cyberpunk';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  return [theme, setTheme];
}