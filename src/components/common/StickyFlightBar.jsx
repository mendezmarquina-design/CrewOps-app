import React from 'react';
import { Plane } from 'lucide-react';

export default function StickyFlightBar({ flight }) {
  if (!flight) return null;

  return (
    <div className="sticky top-14 z-20 w-full bg-bgCard/90 backdrop-blur-md border border-borderCard shadow-sm rounded-2xl py-2 px-3.5 transition-colors duration-200">
      <div className="max-w-xl mx-auto flex items-center justify-between font-mono">
        
        {/* LADO IZQUIERDO: VUELO + RUTA */}
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-cyberCyan dark:text-cyberCyan shrink-0" />
          <div className="flex items-baseline gap-1.5">
            <span className="text-xs sm:text-sm font-black text-cyberYellow dark:text-cyberCoral tracking-wide">
              {flight.flightNumber || 'LA---'}
            </span>
            {flight.route && (
              <span className="text-[10px] font-bold text-cyberCyan dark:text-cyberCyan font-mono ml-0.5">
                ({flight.route})
              </span>
            )}
          </div>
        </div>

        {/* LADO DERECHO: ETD Y ETA ALINEADOS EN HORIZONTAL */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* ETD */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-textSub uppercase font-sans">
              ETD:
            </span>
            <span className="text-sm font-bold text-cyberGreen dark:text-cyberGreen bg-emerald-500/10 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded-md border border-emerald-500/20 dark:border-emerald-500/30 leading-none">
              {flight.etd || '--:--'}
            </span>
          </div>

          {/* ETA */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-textSub uppercase font-sans">
              ETA:
            </span>
            <span className="text-sm font-bold text-cyberGreen dark:text-cyberGreen bg-emerald-500/10 dark:bg-emerald-500/15 px-1.5 py-0.5 rounded-md border border-emerald-500/20 dark:border-emerald-500/30 leading-none">
              {flight.eta || '--:--'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}