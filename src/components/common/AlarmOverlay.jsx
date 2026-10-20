import React, { useEffect, useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { triggerImmediateAlarm } from '../../utils/doorCloseAlarm';

export default function AlarmOverlay({ flightNumber, cierrePuertasTime, onDismiss }) {
  const [isRinging, setIsRinging] = useState(true);

  useEffect(() => {
    // Disparar sonido y vibración al montar
    if (isRinging) {
      triggerImmediateAlarm();
      // Repetir la vibración/sonido cada 3 segundos hasta que se cierre
      const interval = setInterval(() => {
        triggerImmediateAlarm();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isRinging]);

  const handleDismiss = () => {
    setIsRinging(false);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-cyberCoral/95 backdrop-blur-md flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
      {/* Animación de pulso de fondo */}
      <div className="absolute inset-0 bg-cyberCoral/30 animate-ping pointer-events-none" />
      
      <div className="relative z-10 bg-bgCard border-4 border-cyberYellow rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-6 animate-bounce-slow">
        <div className="w-24 h-24 mx-auto rounded-full bg-cyberYellow/20 border-4 border-cyberYellow flex items-center justify-center animate-pulse">
          <AlertTriangle className="w-12 h-12 text-cyberYellow" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-cyberYellow uppercase tracking-tighter">
            ¡Atención!
          </h2>
          <p className="text-sm font-bold text-textSub uppercase tracking-wider">
            Cierre de Puertas Inminente
          </p>
        </div>

        <div className="bg-bgInput border-2 border-cyberCyan rounded-2xl p-4 space-y-1">
          <p className="text-3xl font-black font-mono text-cyberCyan tracking-wider">
            {flightNumber || 'LA---'}
          </p>
          <p className="text-xs font-bold text-textSub uppercase">
            Hora Límite: <span className="text-cyberYellow text-lg">{cierrePuertasTime}</span>
          </p>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full bg-cyberYellow hover:bg-cyberYellow/90 text-textInverseDark font-black text-lg py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <X className="w-6 h-6" />
          DETENER ALARMA
        </button>
      </div>
    </div>
  );
}