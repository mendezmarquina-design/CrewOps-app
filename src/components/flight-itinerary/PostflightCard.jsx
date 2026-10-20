import React, { memo, useState, useMemo, useCallback } from 'react';
import { Droplet, UserCheck, ChevronDown, ChevronUp, CheckCircle2, ArrowRight } from 'lucide-react';
import TimeTile from '../common/TimeTile';
import TimePickerModal from '../modals/TimePickerModal';
import WaterLevelModal from '../modals/WaterLevelModal';
import { useTimePicker } from '../../hooks/useTimePicker';
import { GANTT_TEMPLATES, calculateMilestoneTimes } from '../../data/ganttTemplates';
import { addMinutesToTime } from '../../utils/flightUtils';

// ✅ Helper fuera del componente
const getGanttCrewDisembarkTimes = (flightData) => {
  if (!flightData) return { inicio: '--:--', fin: null };
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
  const hitoCrew = findHitoByKey('desembarque_tripulacion') ||
    findHitoByTitle('desembarque tripulación') ||
    findHitoByTitle('desembarque tripulacion') ||
    findHitoByTitle('desemb. tripulacion');
  const horaInicio = hitoCrew?.calculatedTime || '--:--';
  let horaFin = hitoCrew?.calculatedEndTime || null;
  if (!horaFin && horaInicio !== '--:--' && hitoCrew?.duration) {
    horaFin = addMinutesToTime(horaInicio, hitoCrew.duration);
  }
  return { inicio: horaInicio, fin: horaFin };
};

// ✅ Función pura fuera del componente
const formatLevel = (val) => {
  if (val === undefined || val === null) return 'F';
  if (val === 0) return 'E';
  if (val === 100) return 'F';
  return `${val}%`;
};

function PostflightCard({ flightData, onUpdateFlight, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const { modalConfig, handleFieldClick, closeModal, saveModalTime } = useTimePicker(onUpdateFlight);

  // ✅ Cálculo de gantt memoizado
  const crewTimes = useMemo(() => getGanttCrewDisembarkTimes(flightData), [flightData]);

  // ✅ Display de agua memoizado
  const waterDisplay = useMemo(() => {
    return `${formatLevel(flightData?.waterLevelInicio)} / ${formatLevel(flightData?.waterLevelFin)}`;
  }, [flightData?.waterLevelInicio, flightData?.waterLevelFin]);

  // ✅ Handlers memoizados
  const handleWaterModalOpen = useCallback(() => {
    setIsWaterModalOpen(true);
  }, []);

  const handleWaterModalClose = useCallback(() => {
    setIsWaterModalOpen(false);
  }, []);

  const handleCrewDisembarkClick = useCallback(() => {
    handleFieldClick('desembarqueTripulacion', 'Desembarque Tripulación', flightData?.desembarqueTripulacion);
  }, [handleFieldClick, flightData?.desembarqueTripulacion]);

  const handleSaveWaterLevels = useCallback(({ waterLevelInicio, waterLevelFin }) => {
    onUpdateFlight('waterLevelInicio', waterLevelInicio);
    onUpdateFlight('waterLevelFin', waterLevelFin);
  }, [onUpdateFlight]);

  return (
    <>
      <div className="bg-bgCard border border-borderCard rounded-2xl p-3.5 space-y-3 shadow-sm transition-all">
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between cursor-pointer select-none group gap-2"
        >
          <div className="flex items-center gap-2 shrink-0">
            <div className="p-1 rounded-lg bg-cyberCyan/10 border border-cyberCyan/20 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyberCyan group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-textPrincipal truncate">
              Post Vuelo
            </h4>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyberYellow bg-bgInput px-2.5 py-1 rounded-lg border border-borderCard shadow-inner">
              <span className="text-[10px] font-extrabold uppercase font-sans text-textSub mr-0.5">
                DESEMBARQUE TC:
              </span>
              <span>{crewTimes.inicio}</span>
              {crewTimes.fin && (
                <>
                  <ArrowRight className="w-3 h-3 text-cyberCyan shrink-0 stroke-[2.5]" />
                  <span>{crewTimes.fin}</span>
                </>
              )}
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
          <div className="grid grid-cols-2 gap-2 pt-0.5 border-t border-borderCard/60 pt-3">
            {/* Tile % Registro de Agua */}
            <button
              type="button"
              onClick={handleWaterModalOpen}
              className="relative p-2.5 rounded-xl border border-borderCard bg-bgInput hover:border-cyberCyan/50 transition-all active:scale-95 cursor-pointer overflow-hidden flex flex-col justify-between group text-left min-h-[64px]"
            >
              <Droplet className="absolute -right-1 -bottom-1 w-10 h-10 text-cyberCyan opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none" />
              <span className="text-[10px] font-bold text-textSub group-hover:text-cyberCyan uppercase tracking-wider block transition-colors">
                % Registro Agua
              </span>
              <span className="text-sm font-black font-mono tracking-wider text-cyberYellow block mt-1">
                {waterDisplay}
              </span>
            </button>

            {/* Tile Desembarque Tripulación */}
            <TimeTile
              label="Desembarque Tripulación"
              value={flightData?.desembarqueTripulacion}
              icon={UserCheck}
              onClick={handleCrewDisembarkClick}
            />
          </div>
        )}
      </div>

      {/* Modal para selección de Nivel de Agua */}
      <WaterLevelModal
        isOpen={isWaterModalOpen}
        initialData={{
          waterLevelInicio: flightData?.waterLevelInicio,
          waterLevelFin: flightData?.waterLevelFin
        }}
        onClose={handleWaterModalClose}
        onSave={handleSaveWaterLevels}
      />

      {/* Modal para selección de Hora */}
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
export default memo(PostflightCard);