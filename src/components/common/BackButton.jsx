import React from 'react';
import { Clock } from 'lucide-react';

export default function BackButton({ onClick, title = "Volver a Control de Vuelos", label = "REGRESAR" }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full bg-bgCard hover:bg-bgCardHeader border border-borderCard text-textPrincipal py-3 rounded-2xl font-bold text-xs flex items-center justify-between px-4 transition-all cursor-pointer active:scale-98 shadow-xs"
    >
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-cyberCyan" />
        <span>{title}</span>
      </div>
      <span className="text-[10px] text-textSub uppercase font-extrabold tracking-wider">{label}</span>
    </button>
  );
}