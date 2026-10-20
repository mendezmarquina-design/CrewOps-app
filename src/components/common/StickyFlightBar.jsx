import React, { memo } from 'react';
import { Plane, DoorClosed } from 'lucide-react';

function StickyFlightBar({ flight }) {
  const hasFlight = Boolean(flight);
  
  // La hora de cierre de puertas ya viene calculada por useFlightGantt
  const cpTime = flight?.cierrePuerta || flight?.cierrePuertasTime || '--:--';

  // ✨ ESTADO VACÍO: Mensaje profesional cuando no hay vuelo activo
  if (!hasFlight) {
    return (
      <div className="sticky top-14 z-20 w-full bg-bgCard/90 backdrop-blur-md border border-borderCard shadow-sm rounded-2xl py-2 px-3.5 transition-all duration-200 min-h-[44px]">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2 h-full">
          <Plane className="w-4 h-4 text-textSub/50 shrink-0" />
          <span className="text-xs font-bold text-textSub tracking-wide">
            Sin vuelo activo
          </span>
          <span className="text-[10px] text-textSub/60 hidden sm:inline">
            · Selecciona o crea un vuelo para comenzar
          </span>
        </div>
      </div>
    );
  }

  // ✨ ESTADO CON VUELO
  return (
    <div className="sticky top-14 z-20 w-full bg-bgCard/90 backdrop-blur-md border border-borderCard shadow-sm rounded-2xl py-2 px-3.5 transition-colors duration-200 min-h-[44px]">
      <div className="max-w-xl mx-auto flex items-center justify-between font-mono h-full">
        
        {/* LADO IZQUIERDO: VUELO + RUTA */}
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-cyberCyan shrink-0" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs sm:text-sm font-black text-cyberYellow tracking-wide">
              {flight.flightNumber || 'LA---'}
            </span>
            {flight.route && (
              <span className="text-[10px] font-bold text-cyberCyan font-mono ml-0.5">
                ({flight.route})
              </span>
            )}
          </div>
        </div>

        {/* LADO DERECHO: CP OTP, ETD y ETA */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* NUEVO: CIERRE PUERTAS OTP */}
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-md px-1.5 py-0.5">
            <DoorClosed className="w-3 h-3 text-cyberYellow shrink-0" />
            <span className="text-[9px] font-black text-cyberYellow uppercase font-sans hidden sm:inline"></span>
            <span className="text-xs font-bold text-cyberYellow font-mono">
              {cpTime}
            </span>
          </div>

          {/* ETD */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-textSub uppercase font-sans hidden sm:inline">ETD:</span>
            <span className="text-xs font-bold text-cyberGreen bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded leading-none">
              {flight.etd || '--:--'}
            </span>
          </div>

          {/* ETA */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-textSub uppercase font-sans hidden sm:inline">ETA:</span>
            <span className="text-xs font-bold text-cyberGreen bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded leading-none">
              {flight.eta || '--:--'}
            </span>
          </div>

        </div>
      </div>
    </div>
  );
}

// ✅ Componente memoizado
export default memo(StickyFlightBar);