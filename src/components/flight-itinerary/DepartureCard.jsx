import React, { memo, useState, useMemo, useCallback } from 'react';
import {
  Sparkles, CheckCircle2, DoorOpen, Users, Armchair, DoorClosed,
  ChevronDown, ChevronUp, PlaneTakeoff, Clock, ArrowRight, Target,
  AlertTriangle
} from 'lucide-react';
import TimeTile from '../common/TimeTile';
import TimePickerModal from '../modals/TimePickerModal';
import { useTimePicker } from '../../hooks/useTimePicker';
import { GANTT_TEMPLATES, calculateMilestoneTimes } from '../../data/ganttTemplates';
import { calculateDuration } from '../../utils/flightUtils';

// ✅ Helper: convertir "HH:MM" a minutos totales
const timeToMinutes = (timeStr) => {
  if (!timeStr || timeStr === '--:--') return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

// ✅ Helper: determinar estado del cierre (a tiempo / atrasado)
const getCierreStatus = (cierreManual, cierreCalculado) => {
  if (!cierreManual || cierreManual === '--:--') return null;
  if (!cierreCalculado || cierreCalculado === '--:--') return null;

  const manual = timeToMinutes(cierreManual);
  const calculado = timeToMinutes(cierreCalculado);

  if (manual === null || calculado === null) return null;

  // Manejar cruce de medianoche
  let diff = manual - calculado;
  if (diff < -720) diff += 1440;

  return {
    onTime: diff <= 0,
    diffMinutes: Math.abs(diff)
  };
};

const getGanttDepartureTimes = (flightData) => {
  if (!flightData) {
    return { aseoInicio: '--:--', aseoFin: '--:--', embInicio: '--:--', embFin: '--:--', cierrePuertasCalculado: '--:--' };
  }
  const template =
    GANTT_TEMPLATES.find((t) => t.id === flightData?.ganttTemplateOriginId) ||
    GANTT_TEMPLATES.find((t) => t.id === flightData?.ganttTemplateId) ||
    GANTT_TEMPLATES.find((t) => t.aircraftType?.toUpperCase() === flightData?.aircraftType?.toUpperCase()) ||
    GANTT_TEMPLATES[0];

  const etd = flightData?.etd || flightData?.std || flightData?.departureTime || '--:--';
  const milestones = calculateMilestoneTimes(etd, template?.milestones || []);
  const findHitoByKey = (key) => milestones.find((m) => m.key === key);

  const hitoAseo = findHitoByKey('limpieza_cabina') || findHitoByKey('limpieza_de_cabina');
  const hitoEmb = findHitoByKey('embarque_al_avion') ||
    findHitoByKey('llegada_pasajeros_avion') ||
    findHitoByKey('embarque_en_sala') ||
    findHitoByKey('embarque_sala');
  const hitoCP = findHitoByKey('cierre_puertas');

  return {
    aseoInicio: hitoAseo?.calculatedTime || '--:--',
    aseoFin: hitoAseo?.calculatedEndTime || '--:--',
    embInicio: hitoEmb?.calculatedTime || '--:--',
    embFin: hitoCP?.calculatedTime || '--:--',
    cierrePuertasCalculado: hitoCP?.calculatedTime || '--:--'
  };
};

const ASEO_FIELDS = [
  { key: 'inicioAseoCabina', label: 'Inicio Aseo Cabina', icon: Sparkles },
  { key: 'finAseoCabina', label: 'Fin Aseo Cabina', icon: CheckCircle2 }
];
const EMBARQUE_FIELDS = [
  { key: 'inicioEmbPax', label: 'Inicio Emb. Pax', icon: DoorOpen },
  { key: 'finEmbPax', label: 'Fin Emb. Pax', icon: Users },
  { key: 'finAcomodacion', label: 'Fin Acomodación', icon: Armchair }
];

function DepartureCard({ flightData, onUpdateFlight, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { modalConfig, handleFieldClick, closeModal, saveModalTime } = useTimePicker(onUpdateFlight);

  const handleTileClick = useCallback((key, label, value) => {
    handleFieldClick(key, label, value);
  }, [handleFieldClick]);

  const gantt = useMemo(() => getGanttDepartureTimes(flightData), [flightData]);

  const duracionEmbarqueReal = useMemo(
    () => calculateDuration(flightData?.inicioEmbPax, flightData?.finAcomodacion),
    [flightData?.inicioEmbPax, flightData?.finAcomodacion]
  );

  // ✅ Handler: siempre abre el modal de edición (nunca auto-hora)
  const handleCierrePuertaClick = useCallback(() => {
    const cierreManual = flightData?.cierrePuerta;
    handleFieldClick('cierrePuerta', 'Cierre Puerta (Real)', cierreManual || '--:--');
  }, [flightData?.cierrePuerta, handleFieldClick]);

  const cierreManual = flightData?.cierrePuerta || null;
  const cierreCalculado = gantt.cierrePuertasCalculado;
  const cierreStatus = useMemo(() => getCierreStatus(cierreManual, cierreCalculado), [cierreManual, cierreCalculado]);

  // ✅ Clases dinámicas según estado
  const cierreClasses = useMemo(() => {
    if (!cierreStatus) {
      return {
        container: 'bg-bgInput border-borderCard hover:border-cyberYellow/50',
        title: 'text-cyberYellow', // ✅ SIEMPRE amarillo
        icon: 'text-textSub',
        value: 'bg-bgCardHeader border-borderCard text-textSub',
        badge: null
      };
    }
    if (cierreStatus.onTime) {
      return {
        container: 'bg-cyberGreen/5 border-cyberGreen/50 hover:border-cyberGreen',
        title: 'text-cyberYellow', // ✅ SIEMPRE amarillo
        icon: 'text-cyberGreen',
        value: 'bg-cyberGreen/10 border-cyberGreen/40 text-cyberGreen',
        badge: {
          text: cierreStatus.diffMinutes === 0 ? '✓ Puntual' : `✓ ${cierreStatus.diffMinutes} min antes`,
          color: 'text-cyberGreen'
        }
      };
    } else {
      return {
        container: 'bg-cyberCoral/5 border-cyberCoral/50 hover:border-cyberCoral',
        title: 'text-cyberYellow', // ✅ SIEMPRE amarillo
        icon: 'text-cyberCoral',
        value: 'bg-cyberCoral/10 border-cyberCoral/40 text-cyberCoral',
        badge: {
          text: ` ${cierreStatus.diffMinutes} min atrasado`,
          color: 'text-cyberCoral'
        }
      };
    }
  }, [cierreStatus]);

  return (
    <>
      <div className="bg-bgCard border border-borderCard rounded-2xl p-3.5 space-y-4 shadow-sm transition-all">
        {/* ENCABEZADO */}
        <div
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between cursor-pointer select-none group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1 rounded-lg bg-cyberCyan/10 border border-cyberCyan/20 shrink-0">
              <PlaneTakeoff className="w-3.5 h-3.5 text-cyberCyan group-hover:scale-110 transition-transform" />
            </div>
            <h4 className="text-xs font-black uppercase tracking-wider text-textPrincipal truncate">
              Despegue
            </h4>
          </div>
          <button type="button" className="text-textSub group-hover:text-textMain transition-colors p-1 rounded-lg shrink-0">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {isOpen && (
          <div className="space-y-3 pt-0.5">
            {/* ASEO CABINA */}
            <div className="bg-bgCardHeader/40 border border-borderCard rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 border-b border-borderCard/60 pb-2">
                <span className="text-[10px] font-black tracking-widest text-cyberCyan uppercase block">
                  Aseo Cabina
                </span>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyberYellow bg-bgInput px-2.5 py-1 rounded-lg border border-borderCard shadow-inner">
                  <span className="text-[10px] font-extrabold uppercase font-sans text-textSub mr-0.5">Aseo OTP:</span>
                  <span>{gantt.aseoInicio}</span>
                  <ArrowRight className="w-3 h-3 text-cyberCyan shrink-0 stroke-[2.5]" />
                  <span>{gantt.aseoFin}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                {ASEO_FIELDS.map(({ key, label, icon }) => (
                  <TimeTile
                    key={key}
                    label={label}
                    value={flightData?.[key]}
                    icon={icon}
                    onClick={() => handleTileClick(key, label, flightData?.[key])}
                  />
                ))}
              </div>
            </div>

            {/* EMBARQUE PASAJEROS */}
            <div className="bg-bgCardHeader/40 border border-borderCard rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between gap-2 border-b border-borderCard/60 pb-2">
                <span className="text-[10px] font-black tracking-widest text-cyberCyan uppercase block">
                  Embarque Pasajeros
                </span>
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-cyberYellow bg-bgInput px-2.5 py-1 rounded-lg border border-borderCard shadow-inner">
                  <span className="text-[10px] font-extrabold uppercase font-sans text-textSub mr-0.5">Embarque OTP:</span>
                  <span>{gantt.embInicio}</span>
                  <ArrowRight className="w-3 h-3 text-cyberCyan shrink-0 stroke-[2.5]" />
                  <span>{gantt.embFin}</span>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                {EMBARQUE_FIELDS.map(({ key, label, icon }) => (
                  <TimeTile
                    key={key}
                    label={label}
                    value={flightData?.[key]}
                    icon={icon}
                    onClick={() => handleTileClick(key, label, flightData?.[key])}
                  />
                ))}
              </div>
              {duracionEmbarqueReal && (
                <div className="bg-bgInput/80 border border-borderCard rounded-lg p-2 flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyberCyan" />
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-textSub">
                      Duración Embarque:
                    </span>
                  </div>
                  <span className="text-xs font-black font-mono text-cyberYellow bg-bgCardHeader px-2 py-0.5 rounded border border-cyberYellow/30">
                    {duracionEmbarqueReal}
                  </span>
                </div>
              )}
            </div>

            {/* SECCIÓN CIERRE PUERTAS */}
            <div className="space-y-2 pt-1">
              {/* Límite OTP (calculado, referencia) */}
              <div className="bg-cyberCyan/5 border border-cyberCyan/30 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Target className="w-4 h-4 text-cyberCyan shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-wider text-textMain block">
                      LÍMITE OTP (Calculado)
                    </p>
                    <p className="text-[9px] text-textSub leading-tight mt-0.5">
                      Hora máxima para cumplir OTP
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className="bg-cyberCyan/10 border-2 border-cyberCyan text-cyberYellow font-mono font-black text-sm px-3 py-1.5 rounded-xl tracking-wider">
                    {cierreCalculado}
                  </div>
                </div>
              </div>

              {/* ✅ Cierre Real con colores dinámicos */}
              <button
                type="button"
                onClick={handleCierrePuertaClick}
                className={`w-full p-3 rounded-xl border text-left transition-all active:scale-95 cursor-pointer flex items-center justify-between shadow-sm group ${cierreClasses.container}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {cierreStatus?.onTime === false ? (
                    <AlertTriangle className={`w-4 h-4 shrink-0 ${cierreClasses.icon}`} />
                  ) : (
                    <DoorClosed className={`w-4 h-4 shrink-0 ${cierreClasses.icon}`} />
                  )}
                  <div className="min-w-0">
                    {/* ✅ TÍTULO SIEMPRE EN CYBERYELLOW */}
                    <p className={`text-[10px] font-black uppercase tracking-wider block ${cierreClasses.title}`}>
                      CIERRE PUERTA (Real)
                    </p>
                    <p className="text-[9px] text-textSub leading-tight mt-0.5">
                      {!cierreManual
                        ? 'Sin registrar · Click para ingresar hora'
                        : cierreStatus?.onTime
                          ? 'Cierre a tiempo · Click para editar'
                          : 'Fuera de tiempo · Click para editar'}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <div className={`font-mono font-black text-base px-3 py-1.5 rounded-lg tracking-wider ${cierreClasses.value}`}>
                    {cierreManual || '--:--'}
                  </div>
                  {cierreClasses.badge && (
                    <span className={`text-[8px] font-black block mt-1 uppercase ${cierreClasses.badge.color}`}>
                      {cierreClasses.badge.text}
                    </span>
                  )}
                </div>
              </button>
            </div>
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

export default memo(DepartureCard);