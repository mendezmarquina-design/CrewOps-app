import React, { memo, useState, useMemo, useCallback } from 'react';
import { DoorOpen, LogOut, UserCheck, ChevronDown, ChevronUp, PlaneLanding, Clock, ArrowRight } from 'lucide-react';
import TimeTile from '../common/TimeTile';
import TimePickerModal from '../modals/TimePickerModal';
import { useTimePicker } from '../../hooks/useTimePicker';
import { GANTT_TEMPLATES, calculateMilestoneTimes } from '../../data/ganttTemplates';
import { addMinutesToTime, calculateDuration } from '../../utils/flightUtils';

// ✅ Helper fuera del componente
const getGanttLandingTimes = (flightData) => {
  if (!flightData) return { inicio: '--:--', fin: '--:--' };
  const template =
    GANTT_TEMPLATES.find((t) => t.id === flightData?.ganttTemplateDestId) ||
    GANTT_TEMPLATES.find((t) => t.id === flightData?.ganttTemplateId) ||
    GANTT_TEMPLATES.find((t) => t.aircraftType?.toUpperCase() === flightData?.aircraftType?.toUpperCase()) ||
    GANTT_TEMPLATES[0];
  const eta = flightData?.eta || flightData?.sta || flightData?.arrivalTime || '00:00';
  const destTat = template?.tat || 0;
  const baseEtaWithTat = addMinutesToTime(eta, destTat);
  const milestones = calculateMilestoneTimes(baseEtaWithTat, template?.milestones || []);
  const findHitoByKey = (key) => milestones.find((m) => m.key === key);
  const findHitoByTitle = (query) =>
    milestones.find((m) => (m.title || m.label || '').toLowerCase().includes(query.toLowerCase()));
  const hitoInicio = findHitoByKey('inicio_desembarque') || findHitoByTitle('inicio desembarque') || findHitoByTitle('apertura puertas') || findHitoByTitle('desembarque');
  const hitoFin = findHitoByKey('fin_desembarque') || findHitoByTitle('fin desembarque') || findHitoByTitle('fin desemb');
  const horaInicio = hitoInicio?.calculatedTime || '--:--';
  let horaFin = hitoFin?.calculatedTime || hitoFin?.calculatedEndTime || hitoInicio?.calculatedEndTime || '--:--';
  if (horaFin === '--:--' && horaInicio !== '--:--' && hitoInicio?.duration) {
    horaFin = addMinutesToTime(horaInicio, hitoInicio.duration);
  }
  return { inicio: horaInicio, fin: horaFin };
};

// ✅ Array de campos fuera del componente
const FIELDS = [
  { key: 'aperturaPuerta', label: 'Apertura Puerta', icon: DoorOpen },
  { key: 'inicioDesemb', label: 'Inicio Desemb.', icon: LogOut },
  { key: 'finDesemb', label: 'Fin Desemb.', icon: UserCheck }
];

function LandingCard({ flightData, onUpdateFlight, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { modalConfig, handleFieldClick, closeModal, saveModalTime } = useTimePicker(onUpdateFlight);

  // ✅ Handler estable para el click de tiles
  const handleTileClick = useCallback((key, label, value) => {
    handleFieldClick(key, label, value);
  }, [handleFieldClick]);

  // ✅ Cálculo de gantt memoizado
  const ganttTimes = useMemo(() => getGanttLandingTimes(flightData), [flightData]);

  // ✅ Duración de desembarque memoizada
  const { hasBothTimes, duracionDesembarque } = useMemo(() => {
    const startTime = flightData?.inicioDesemb || flightData?.aperturaPuerta;
    const endTime = flightData?.finDesemb;
    const hasBoth = Boolean(
      startTime && endTime && startTime !== '--:--' && endTime !== '--:--'
    );
    const duration = hasBoth ? calculateDuration(startTime, endTime) : null;
    return { hasBothTimes: hasBoth, duracionDesembarque: duration };
  }, [flightData?.inicioDesemb, flightData?.aperturaPuerta, flightData?.finDesemb]);

  return (
    <>
      <div className="bg-bgCard border border-borderCard rounded-2xl p-3.5 space-y-3 shadow-sm transition-all">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between cursor-pointer select-none group gap-2"
        >
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1 rounded-lg bg-cyberCyan/10 border border-cyberCyan/20 shrink-0">
              <PlaneLanding className="w-3.5 h-3.5 text-cyberCyan group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-textPrincipal truncate">
              Aterrizaje
            </h4>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyberYellow bg-bgInput px-2.5 py-1 rounded-lg border border-borderCard shadow-inner">
              <span className="text-[10px] font-extrabold uppercase font-sans text-textSub mr-0.5">
                Desembarque OTP:
              </span>
              <span>{ganttTimes.inicio}</span>
              <ArrowRight className="w-3 h-3 text-cyberCyan shrink-0 stroke-[2.5]" />
              <span>{ganttTimes.fin}</span>
            </div>
            <button
              type="button"
              className="text-textSub group-hover:text-textMain transition-colors p-1 rounded-lg shrink-0"
            >
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {isOpen && (
          <div className="space-y-3 border-t border-borderCard/60 pt-3">
            <div className="grid grid-cols-3 gap-2">
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

            {hasBothTimes && duracionDesembarque && (
              <div className="bg-bgInput/80 border border-borderCard rounded-lg p-2 flex items-center justify-between transition-all">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-cyberCyan" />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-textSub">
                    Duración Desembarque:
                  </span>
                </div>
                <span className="text-xs font-black font-mono text-cyberYellow bg-bgCardHeader px-2 py-0.5 rounded border border-cyberYellow/30">
                  {duracionDesembarque}
                </span>
              </div>
            )}
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
export default memo(LandingCard);