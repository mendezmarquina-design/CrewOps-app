import React, { memo, useState, useMemo, useCallback } from 'react';
import { Plane, LogOut, Users, UserCheck, ChevronDown, ChevronUp, Clock, AlertTriangle } from 'lucide-react';
import TimeTile from '../common/TimeTile';
import TimePickerModal from '../modals/TimePickerModal';
import { useTimePicker } from '../../hooks/useTimePicker';
import { GANTT_TEMPLATES, calculateMilestoneTimes } from '../../data/ganttTemplates';

// ✅ Helper: obtener tiempos de referencia del template Gantt
const getPreflightReferenceTimes = (flightData) => {
  if (!flightData) return {};

  // Buscar template por ID de origen, luego por ID general, luego por tipo de avión
  const template =
    GANTT_TEMPLATES.find((t) => t.id === flightData?.ganttTemplateOriginId) ||
    GANTT_TEMPLATES.find((t) => t.id === flightData?.ganttTemplateId) ||
    GANTT_TEMPLATES.find((t) => t.aircraftType?.toUpperCase() === flightData?.aircraftType?.toUpperCase()) ||
    GANTT_TEMPLATES[0];

  const etd = flightData?.etd || flightData?.std || flightData?.departureTime || '--:--';
  const milestones = calculateMilestoneTimes(etd, template?.milestones || []);

  const findHitoByKey = (keys) => {
    for (const key of keys) {
      const hito = milestones.find((m) => m.key === key);
      if (hito) return hito;
    }
    return null;
  };

  const hitoArribo = findHitoByKey(['llegada_avion', 'llegada_del_avion', 'arribo_avion']);
  const hitoBajaTrip = findHitoByKey(['baja_tripulacion_anterior', 'baja_trip_anterior', 'desembarque_tripulacion_anterior']);
  const hitoLlegadaTrip = findHitoByKey(['llegada_tripulacion', 'llegada_de_tripulacion']);
  const hitoInicioEmbTrip = findHitoByKey(['inicio_embarque_tripulacion', 'inicio_emb_trip', 'embarque_tripulacion']);

  return {
    arriboAvion: hitoArribo?.calculatedTime,
    bajaTripAnterior: hitoBajaTrip?.calculatedTime,
    llegadaTripulacion: hitoLlegadaTrip?.calculatedTime,
    inicioEmbTrip: hitoInicioEmbTrip?.calculatedTime
  };
};

const FIELDS = [
  { key: 'arriboAvion', label: 'Arribo Avión', icon: Plane },
  { key: 'bajaTripAnterior', label: 'Baja Trip. Anterior', icon: LogOut },
  { key: 'llegadaTripulacion', label: 'Llegada Tripulación', icon: Users },
  { key: 'inicioEmbTrip', label: 'Inicio Emb. Trip.', icon: UserCheck }
];

function PreflightCard({ flightData, onUpdateFlight, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { modalConfig, handleFieldClick, closeModal, saveModalTime } = useTimePicker(onUpdateFlight);

  const handleTileClick = useCallback((key, label, value) => {
    handleFieldClick(key, label, value);
  }, [handleFieldClick]);

  const hasArriboAvion = useMemo(() => {
    return Boolean(flightData?.arriboAvion && flightData?.arriboAvion !== '--:--');
  }, [flightData?.arriboAvion]);

  // ✅ Calcular tiempos de referencia del template Gantt
  const referenceTimes = useMemo(() => getPreflightReferenceTimes(flightData), [flightData]);

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
                referenceTime={referenceTimes[key]}
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

export default memo(PreflightCard);