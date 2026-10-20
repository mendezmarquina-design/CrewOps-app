import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  DoorOpen, 
  Users, 
  Armchair, 
  DoorClosed, 
  ChevronDown, 
  ChevronUp,
  PlaneTakeoff,
  Clock,
  ArrowRight
} from 'lucide-react';
import TimeTile from '../common/TimeTile';
import TimePickerModal from '../modals/TimePickerModal';
import { useTimePicker } from '../../hooks/useTimePicker';
import { GANTT_TEMPLATES, calculateMilestoneTimes } from '../../data/ganttTemplates';
import { timeToMinutes, calculateDuration } from '../../utils/flightUtils';

const getGanttDepartureTimes = (flightData) => {
  if (!flightData) {
    return { aseoInicio: '--:--', aseoFin: '--:--', embInicio: '--:--', embFin: '--:--', cierrePuertas: '--:--' };
  }

  const template =
    GANTT_TEMPLATES.find((t) => t.id === flightData?.ganttTemplateId) ||
    GANTT_TEMPLATES.find((t) => t.aircraftType?.toUpperCase() === flightData?.aircraftType?.toUpperCase()) ||
    GANTT_TEMPLATES[0];

  const etd = flightData?.etd || flightData?.std || flightData?.departureTime || flightData?.scheduledDeparture || '--:--';
  const milestones = calculateMilestoneTimes(etd, template?.milestones || []);

  const findHitoByKey = (key) => milestones.find((m) => m.key === key);

  const hitoAseo = findHitoByKey('limpieza_cabina');
  const hitoEmb = findHitoByKey('embarque_sala') || findHitoByKey('embarque_al_avion');
  const hitoCP = findHitoByKey('cierre_puertas');

  const metaCierrePuerta = hitoCP?.calculatedTime || flightData?.cierrePuertasTime || '--:--';

  return {
    aseoInicio: hitoAseo?.calculatedTime || '--:--',
    aseoFin: hitoAseo?.calculatedEndTime || '--:--',
    embInicio: hitoEmb?.calculatedTime || '--:--',
    embFin: metaCierrePuerta,
    cierrePuertas: metaCierrePuerta
  };
};

export default function DepartureCard({ flightData, onUpdateFlight, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { modalConfig, handleFieldClick, closeModal, saveModalTime } = useTimePicker(onUpdateFlight);

  const gantt = getGanttDepartureTimes(flightData);

  const aseoFields = [
    { key: 'inicioAseoCabina', label: 'Inicio Aseo Cabina', icon: Sparkles },
    { key: 'finAseoCabina', label: 'Fin Aseo Cabina', icon: CheckCircle2 }
  ];

  const embarqueFields = [
    { key: 'inicioEmbPax', label: 'Inicio Emb. Pax', icon: DoorOpen },
    { key: 'finEmbPax', label: 'Fin Emb. Pax', icon: Users },
    { key: 'finAcomodacion', label: 'Fin Acomodación', icon: Armchair }
  ];

  const duracionAseoReal = calculateDuration(flightData?.inicioAseoCabina, flightData?.finAseoCabina);
  const duracionEmbarqueReal = calculateDuration(flightData?.inicioEmbPax, flightData?.finAcomodacion);

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
                  <span className="text-[10px] font-extrabold uppercase font-sans text-textSub mr-0.5">
                    Aseo OTP:
                  </span>
                  <span>{gantt.aseoInicio}</span>
                  <ArrowRight className="w-3 h-3 text-cyberCyan shrink-0 stroke-[2.5]" />
                  <span>{gantt.aseoFin}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-0.5">
                {aseoFields.map(({ key, label, icon }) => (
                  <TimeTile
                    key={key}
                    label={label}
                    value={flightData?.[key]}
                    icon={icon}
                    onClick={() => handleFieldClick(key, label, flightData?.[key])}
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
                  <span className="text-[10px] font-extrabold uppercase font-sans text-textSub mr-0.5">
                    Embarque OTP:
                  </span>
                  <span>{gantt.embInicio}</span>
                  <ArrowRight className="w-3 h-3 text-cyberCyan shrink-0 stroke-[2.5]" />
                  <span>{gantt.embFin}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-0.5">
                {embarqueFields.map(({ key, label, icon }) => (
                  <TimeTile
                    key={key}
                    label={label}
                    value={flightData?.[key]}
                    icon={icon}
                    onClick={() => handleFieldClick(key, label, flightData?.[key])}
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

            {/* SECCIÓN CIERRE PUERTAS (Directa en el grid, sin card exterior) */}
            <div className="grid grid-cols-12 gap-2.5 items-stretch pt-1">
              {/* Lado Izquierdo: Explicación + HORA LÍMITE OTP Destacada */}
              <div className="col-span-7 bg-bgInput border border-borderCard rounded-xl p-2.5 flex items-center justify-between shadow-sm">
                <p className="text-[11px] leading-tight text-textMain font-semibold pr-2">
                  Para cumplir con el <span className="font-extrabold text-cyberYellow">OTP</span>, la hora límite de Cierre de Puertas es:
                </p>
                
                {/* Insignia OTP llamativa con Leyenda */}
                <div className="text-center shrink-0">
                  <div className="bg-amber-500/10 border-2 border-cyberYellow text-cyberYellow font-mono font-black text-sm px-3 py-1.5 rounded-xl shadow-[0_0_12px_rgba(245,158,11,0.25)] tracking-wider">
                    {gantt.cierrePuertas}
                  </div>
                  <span className="text-[8px] font-black text-cyberYellow uppercase tracking-wider block mt-1">
                    LÍMITE OTP
                  </span>
                </div>
              </div>

              {/* Lado Derecho: Input Cierre Puerta */}
              <div className="col-span-5">
                <button
                  type="button"
                  onClick={() => handleFieldClick('cierrePuerta', 'Cierre Puerta', flightData?.cierrePuerta || gantt.cierrePuertas)}
                  className="w-full h-full p-2.5 rounded-xl border border-cyberCyan/50 bg-bgInput hover:border-cyberCyan text-left transition-all active:scale-95 cursor-pointer flex flex-col justify-between shadow-sm group"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[11px] font-black uppercase tracking-wider text-textPrincipal group-hover:text-cyberCyan transition-colors">
                      CIERRE PUERTA
                    </span>
                    <DoorClosed className="w-3.5 h-3.5 text-cyberCyan" />
                  </div>
                  <div className="bg-bgCardHeader border border-borderCard group-hover:border-cyberYellow/80 rounded-lg px-2 py-1.5 text-center mt-1">
                    <span className="text-base font-black font-mono tracking-widest text-cyberYellow block">
                      {flightData?.cierrePuerta || '--:--'}
                    </span>
                  </div>
                </button>
              </div>
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