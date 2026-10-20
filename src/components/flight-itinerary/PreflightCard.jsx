import React, { memo, useState, useMemo, useCallback } from 'react';
import { Plane, LogOut, Users, UserCheck, ChevronDown, ChevronUp, Clock, AlertTriangle } from 'lucide-react';
import TimeTile from '../common/TimeTile';
import TimePickerModal from '../modals/TimePickerModal';
import { useTimePicker } from '../../hooks/useTimePicker';

// ✅ Array de campos fuera del componente (no se recrea)
const FIELDS = [
  { key: 'arriboAvion', label: 'Arribo Avión', icon: Plane },
  { key: 'bajaTripAnterior', label: 'Baja Trip. Anterior', icon: LogOut },
  { key: 'llegadaTripulacion', label: 'Llegada Tripulación', icon: Users },
  { key: 'inicioEmbTrip', label: 'Inicio Emb. Trip.', icon: UserCheck }
];

function PreflightCard({ flightData, onUpdateFlight, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { modalConfig, handleFieldClick, closeModal, saveModalTime } = useTimePicker(onUpdateFlight);

  // ✅ Handler estable para el click de tiles
  const handleTileClick = useCallback((key, label, value) => {
    handleFieldClick(key, label, value);
  }, [handleFieldClick]);

  // ✅ Memoizado: verificación de arribo de avión
  const hasArriboAvion = useMemo(() => {
    return Boolean(flightData?.arriboAvion && flightData?.arriboAvion !== '--:--');
  }, [flightData?.arriboAvion]);

  return (
    <>
      <div className="bg-bgCard border border-borderCard rounded-2xl p-3.5 space-y-3 shadow-sm transition-all">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between cursor-pointer select-none group gap-2"
        >
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1 rounded-lg bg-cyberCyan/10 border border-cyberCyan/20 shrink-0">
              <Clock className="w-3.5 h-3.5 text-cyberCyan group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-textPrincipal truncate">
              Prevuelo
            </h4>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {!hasArriboAvion && (
              <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-1 rounded-lg border border-rose-500/20 shadow-inner animate-pulse">
                <AlertTriangle className="w-3 h-3 shrink-0" />
                <span className="uppercase tracking-wider">Arribo avión no registrado</span>
              </div>
            )}
            <button
              type="button"
              className="text-textSub group-hover:text-textMain transition-colors p-1 rounded-lg shrink-0"
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="grid grid-cols-2 gap-2 pt-0.5 border-t border-borderCard/60 pt-3">
            {FIELDS.map(({ key, label, icon }) => (
              <TimeTile
                key={key}
                label={label}
                value={flightData?.[key]}
                icon={icon}
                onClick={() => handleTileClick(key, label, flightData?.[key])}
              />
            ))}
          </div>
        )}
      </div>

      <TimePickerModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        initialValue={modalConfig.initialValue}
        onClose={closeModal}
        onSave={saveModalTime}
      />
    </>
  );
}

// ✅ Componente memoizado
export default memo(PreflightCard);