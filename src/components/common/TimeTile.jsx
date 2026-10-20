import React, { memo } from 'react';

function TimeTile({ label, value, icon: Icon, onClick }) {
  const hasVal = Boolean(value) && value !== '--:--' && value !== '--: --';

  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-3 py-2 rounded-xl border text-left transition-all active:scale-[0.97] cursor-pointer overflow-hidden group ${
        hasVal
          ? 'bg-cyberCyan/10 border-cyberCyan/50 text-cyberCyan shadow-[0_0_12px_rgba(0,229,255,0.08)]'
          : 'bg-bgInput border-borderCard text-textSub hover:border-cyberCyan/40 hover:bg-bgCardHeader/50'
      }`}
    >
      {/* Marca de agua flotante de fondo */}
      {Icon && (
        <Icon
          className={`absolute -right-2 -bottom-2 w-10 h-10 pointer-events-none transition-all duration-300 group-hover:scale-110 ${
            hasVal
              ? 'text-cyberCyan opacity-20 group-hover:opacity-30'
              : 'text-textSub opacity-10 group-hover:opacity-20'
          }`}
        />
      )}

      {/* Contenido principal */}
      <div className="relative z-10 space-y-0.5">
        <div
          className={`text-[10px] font-bold tracking-wider uppercase truncate pr-3 transition-colors ${
            hasVal ? 'text-textPrincipal' : 'text-textSub group-hover:text-textMain'
          }`}
        >
          {label}
        </div>
        <div
          className={`text-base font-black font-mono tracking-wider ${
            hasVal ? 'text-cyberYellow' : 'text-textSub/60'
          }`}
        >
          {value || '--:--'}
        </div>
      </div>
    </button>
  );
}

// ✅ Componente memoizado
export default memo(TimeTile);