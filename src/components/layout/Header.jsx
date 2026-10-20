import React from 'react';
import { Menu } from 'lucide-react';
import InstallPwaButton from '../InstallPwaButton';

export default function Header({ onOpenMenu }) {
  return (
    <header className="h-14 bg-bgCard border-b border-borderCard flex items-center justify-between px-4 sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-3">
        <button 
          type="button"
          onClick={onOpenMenu} 
          aria-label="Abrir menú"
          className="p-2 hover:bg-bgInput rounded-xl text-textSub hover:text-textMain transition-colors cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <img src="/favicon.svg" alt="CabinOps Logo" className="w-5 h-5 shrink-0" />
          <h1 className="font-black text-xs tracking-widest text-textPrincipal uppercase">
            OTP - Control de Vuelo
          </h1>
        </div>
      </div>

      <div className="flex items-center space-x-3">
        <InstallPwaButton />
        <span className="w-2.5 h-2.5 rounded-full bg-cyberCyan shadow-[0_0_10px_rgba(0,240,255,0.6)]" />
      </div>
    </header>
  );
}