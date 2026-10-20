import React from 'react';
import { Palette } from 'lucide-react';
import { useAppTheme } from '../../contex/ThemeContext';

export default function ThemeSelector() {
  const { currentTheme, setCurrentTheme } = useAppTheme();

  return (
    <div className="flex items-center gap-1.5 bg-bgCardHeader p-1.5 rounded-xl border border-border-color transition-colors duration-200">
      <Palette className="w-3.5 h-3.5 text-sub ml-1 flex-shrink-0" />
      <select
        value={currentTheme}
        onChange={(e) => setCurrentTheme(e.target.value)}
        className="bg-transparent text-xs font-semibold text-main focus:outline-none cursor-pointer w-full"
      >
        <option value="cyberpunk" className="bg-bgCard text-main">
          ⚡ Predeterminado (Cyberpunk)
        </option>
        <option value="dark-corp" className="bg-bgCard text-main">
          🌙 Oscuro Corporativo
        </option>
        <option value="light-corp" className="bg-bgCard text-main">
          ☀️ Claro Corporativo
        </option>
      </select>
    </div>
  );
}