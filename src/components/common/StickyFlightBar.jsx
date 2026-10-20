import React, { memo, useState, useEffect } from 'react';
import { Plane, DoorClosed, Bell } from 'lucide-react';

function StickyFlightBar({ flight, onOpenAlarmModal }) {
  const hasFlight = Boolean(flight);
  const cpTime = flight?.cierrePuerta || flight?.cierrePuertasTime || '--:--';

  // ✅ FIX #2: Verificar toggle Y minutos configurados
  const [alarmActive, setAlarmActive] = useState(() => {
    const isEnabled = localStorage.getItem('doorCloseAlarm') === 'true';
    const hasMinutes = localStorage.getItem('alarmMinutesList');
    return isEnabled && hasMinutes;
  });

  useEffect(() => {
    const checkAlarm = () => {
      const isEnabled = localStorage.getItem('doorCloseAlarm') === 'true';
      const hasMinutes = localStorage.getItem('alarmMinutesList');
      setAlarmActive(isEnabled && hasMinutes);
    };
    const interval = setInterval(checkAlarm, 2000);
    return () => clearInterval(interval);
  }, []);

  if (!hasFlight) {
    return (
      <div className="sticky top-14 z-20 w-full bg-bgCard/90 backdrop-blur-md border border-borderCard shadow-sm rounded-2xl py-2 px-3.5 transition-all duration-200 min-h-[44px]">
        <div className="max-w-xl mx-auto flex items-center justify-center gap-2 h-full">
          <Plane className="w-4 h-4 text-textSub/50 shrink-0" />
          <span className="text-xs font-bold text-textSub tracking-wide">Sin vuelo activo</span>
          <span className="text-[10px] text-textSub/60 hidden sm:inline">· Selecciona o crea un vuelo para comenzar</span>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky top-14 z-20 w-full bg-bgCard/90 backdrop-blur-md border border-borderCard shadow-sm rounded-2xl py-2 px-3.5 transition-colors duration-200 min-h-[44px]">
      <div className="max-w-xl mx-auto flex items-center justify-between font-mono h-full">
        
        {/* LADO IZQUIERDO: Vuelo + Ruta (clickeable) */}
        <div className="flex items-center gap-2">
          <Plane className="w-4 h-4 text-cyberCyan shrink-0" />
          <div className="flex flex-col leading-tight">
            {/* ✅ FIX #1: Botón que abre el modal */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenAlarmModal) {
                  onOpenAlarmModal();
                }
              }}
              className="text-sm font-black text-cyberYellow tracking-wide hover:text-cyberCyan transition-colors cursor-pointer flex items-center gap-1.5 text-left"
              title="Configurar alarmas de cierre de puertas"
            >
              {flight.flightNumber || 'LA---'}
              {/* ✅ FIX #2: Campana solo si hay alarmas configuradas */}
              {alarmActive && (
                <Bell className="w-3.5 h-3.5 text-cyberYellow animate-pulse" />
              )}
            </button>
            {flight.route && (
              <span className="text-[9px] font-bold text-cyberCyan font-mono tracking-wider">
                {flight.route}
              </span>
            )}
          </div>
        </div>

        {/* LADO DERECHO: CP OTP, ETD y ETA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 rounded-md px-1.5 py-0.5">
            <DoorClosed className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="text-[9px] font-black text-amber-400 uppercase font-sans hidden sm:inline">CP:</span>
            <span className="text-xs font-bold text-amber-400 font-mono">{cpTime}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-black text-textSub uppercase font-sans hidden sm:inline">ETD:</span>
            <span className="text-xs font-bold text-cyberGreen bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded leading-none">
              {flight.etd || '--:--'}
            </span>
          </div>
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

export default memo(StickyFlightBar);