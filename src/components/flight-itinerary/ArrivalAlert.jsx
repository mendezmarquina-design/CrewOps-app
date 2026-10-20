import React, { useState, memo, useCallback } from 'react';
import { Plane, Clock, X } from 'lucide-react';
import TimePickerModal from '../modals/TimePickerModal';

function ArrivalAlert({ flight, onUpdateFlight }) {
  const [isTimeModalOpen, setIsTimeModalOpen] = useState(false);

  const hasArrival = Boolean(
    flight?.arriboAvion &&
    flight.arriboAvion !== '--:--' &&
    flight.arriboAvion.trim() !== ''
  );

  const handleOpenModal = useCallback(() => {
    setIsTimeModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsTimeModalOpen(false);
  }, []);

  const handleSaveTime = useCallback(async (time) => {
    if (onUpdateFlight) {
      await onUpdateFlight('arriboAvion', time);
    }
    setIsTimeModalOpen(false);
  }, [onUpdateFlight]);

  // Si ya tiene arribo registrado, no mostrar nada
  if (hasArrival) return null;

  return (
    <>
      <div className="bg-cyberCoral/10 border-2 border-cyberCoral/50 rounded-2xl p-4 shadow-lg animate-pulse-slow max-w-md mx-auto">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1">
            <div className="bg-cyberCoral/20 p-2.5 rounded-xl border border-cyberCoral/30">
              <Plane className="w-5 h-5 text-cyberCoral animate-bounce" />
            </div>
            <div className="flex-1">
              <h3 className="text-xs font-black uppercase tracking-wider text-cyberCoral mb-0.5">
                Arribo de Avión
              </h3>
              <p className="text-[10px] text-textSub font-medium">
                Ingresa la hora de llegada del avión para continuar
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenModal}
            className="bg-cyberCoral hover:bg-cyberCoral/90 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-all active:scale-95 shadow-md flex items-center gap-1.5"
          >
            <Clock className="w-4 h-4" />
            <span>Ingresar</span>
          </button>
        </div>
      </div>

      <TimePickerModal
        isOpen={isTimeModalOpen}
        title="ARRIBO DE AVIÓN"
        initialValue=""
        onClose={handleCloseModal}
        onSave={handleSaveTime}
      />
    </>
  );
}

export default memo(ArrivalAlert);