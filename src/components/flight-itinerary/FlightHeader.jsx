import React, { useState, memo, useMemo, useCallback, useEffect } from 'react';
import { FileText, BarChart2, Users, X, ChevronDown, ChevronUp, Users as UsersIcon, Bell } from 'lucide-react';
import TimePickerModal from '../modals/TimePickerModal';
import SelectAircraftModal from '../modals/SelectAircraftModal';
import { calculateDelay, calculateMinutesDifference } from '../../utils/flightUtils';

function FlightHeader({
  flight,
  itineraryController,
  onOpenBriefing,
  onOpenGantt,
  onOpenGCEs,
  onOpenAlarmModal
}) {
  const [isOpen, setIsOpen] = useState(false);

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

  const isArriboAvionValid = useMemo(() => {
    return Boolean(
      flight?.arriboAvion &&
      flight.arriboAvion !== '--:--' &&
      flight.arriboAvion.trim() !== ''
    );
  }, [flight?.arriboAvion]);

  const depDelay = useMemo(
    () => calculateDelay(flight?.etd || '19:25', flight?.atd),
    [flight?.etd, flight?.atd]
  );

  const arrDelay = useMemo(
    () => calculateDelay(flight?.eta || '23:30', flight?.ata),
    [flight?.eta, flight?.ata]
  );

  const tatDisplay = useMemo(() => {
    if (!isArriboAvionValid || !flight?.etd) return '--';
    const minutes = calculateMinutesDifference(flight.arriboAvion, flight.etd);
    if (minutes === null || minutes < 0) return '--';
    return `${minutes} min`;
  }, [isArriboAvionValid, flight?.arriboAvion, flight?.etd]);

  const {
    flightPrefix,
    flightNumberOnly,
    modalState,
    openTimeModal,
    closeTimeModal,
    handleSaveTime,
    isPaxModalOpen,
    setIsPaxModalOpen,
    paxInput,
    setPaxInput,
    handleSavePax,
    isAircraftModalOpen,
    setIsAircraftModalOpen,
    handleSelectAircraft
  } = itineraryController;

  const handleOpenAircraftModal = useCallback(() => {
    setIsAircraftModalOpen(true);
  }, [setIsAircraftModalOpen]);

  const handleOpenPaxModal = useCallback(() => {
    setIsPaxModalOpen(true);
  }, [setIsPaxModalOpen]);

  const handleClosePaxModal = useCallback(() => {
    setIsPaxModalOpen(false);
  }, [setIsPaxModalOpen]);

  const handleCloseAircraftModal = useCallback(() => {
    setIsAircraftModalOpen(false);
  }, [setIsAircraftModalOpen]);

  const handleOpenTimeModalAtd = useCallback(() => {
    openTimeModal('REAL (ATD)', 'atd', flight?.atd);
  }, [openTimeModal, flight?.atd]);

  const handleOpenTimeModalAta = useCallback(() => {
    openTimeModal('REAL (ATA)', 'ata', flight?.ata);
  }, [openTimeModal, flight?.ata]);

  const handleOpenTimeModalOnPista = useCallback(() => {
    openTimeModal('ON (PISTA)', 'onPista', flight?.onPista);
  }, [openTimeModal, flight?.onPista]);

  const handleOpenGanttClick = useCallback(() => {
    if (isArriboAvionValid && onOpenGantt) {
      onOpenGantt(flight);
    }
  }, [isArriboAvionValid, onOpenGantt, flight]);

  const handleOpenBriefingClick = useCallback(() => {
    if (onOpenBriefing) onOpenBriefing(flight);
  }, [onOpenBriefing, flight]);

  const handleToggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  if (!flight) return null;

  const hasTailNumber = Boolean(flight.tailNumber && flight.tailNumber.trim() !== '');

  return (
    <>
      <div className="bg-bgCard border border-borderCard rounded-2xl shadow-sm max-w-md mx-auto overflow-hidden transition-all">
        
        {/* CABECERA COMPACTA (SIEMPRE VISIBLE) */}
        <div
          onClick={handleToggleOpen}
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-bgCardHeader/50 transition-colors select-none"
        >
          {/* LADO IZQUIERDO: Vuelo, Ruta, Matrícula */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Número de vuelo clickeable para abrir modal de alarmas */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenAlarmModal) {
                  onOpenAlarmModal();
                }
              }}
              className="bg-bgInput border border-borderCard hover:border-cyberYellow/50 p-2 rounded-xl shrink-0 flex items-center justify-center text-textPrincipal transition-all cursor-pointer relative"
              title="Configurar alarmas de cierre de puertas"
            >
              <span className="text-sm font-black text-cyberCoral font-mono italic">
                {flightPrefix}{flightNumberOnly || '777'}
              </span>
              {/* ✅ FIX #2: Campana solo si hay alarmas configuradas */}
              {alarmActive && (
                <Bell className="w-3 h-3 text-cyberYellow animate-pulse absolute -top-1 -right-1" />
              )}
            </button>
            <div className="min-w-0">
              <p className="text-xs font-mono font-bold text-cyberCyan truncate">
                {flight.route || '---'}
              </p>
              {/* Matrícula más grande, sin etiqueta "Matrícula:" */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenAircraftModal();
                }}
                className={`mt-1 text-xs font-black font-mono px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  hasTailNumber
                    ? 'text-cyberYellow bg-cyberYellow/10 border border-cyberYellow/30 hover:bg-cyberYellow/20 hover:border-cyberYellow/60'
                    : 'text-cyberCoral bg-cyberCoral/15 border-2 border-cyberCoral/50 animate-pulse hover:bg-cyberCoral/25'
                }`}
                title={hasTailNumber ? 'Cambiar matrícula' : 'Asignar matrícula'}
              >
                {hasTailNumber ? flight.tailNumber : 'Asignar Matrícula'}
              </button>
            </div>
          </div>
          
          {/* LADO DERECHO: Total PAX + Chevron */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenPaxModal();
              }}
              className="flex items-center gap-2 bg-bgInput border border-borderCard hover:border-cyberYellow/50 rounded-xl px-3 py-1.5 transition-all cursor-pointer active:scale-95"
              title="Ingresar Total Pasajeros"
            >
              <UsersIcon className="w-4 h-4 text-cyberCyan shrink-0" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-[8px] font-black text-textSub uppercase tracking-wider">
                  PAX
                </span>
                <span className="text-base font-black font-mono text-cyberYellow leading-none">
                  {flight.totalPax ?? 0}
                </span>
              </div>
            </button>
            {isOpen ? (
              <ChevronUp className="w-5 h-5 text-textSub shrink-0" />
            ) : (
              <ChevronDown className="w-5 h-5 text-textSub shrink-0" />
            )}
          </div>
        </div>

        {/* CONTENIDO DESPLEGABLE */}
        {isOpen && (
          <div className="p-4 pt-0 space-y-3 border-t border-borderCard/50">
            
            {/* TRIPLE BOTÓN DE ACCIÓN */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                disabled={!isArriboAvionValid}
                onClick={handleOpenGanttClick}
                title={!isArriboAvionValid ? 'Ingrese el horario de Arribo Avión para activar la Carta Gantt' : ''}
                className={`w-full py-2.5 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all ${
                  isArriboAvionValid
                    ? 'bg-cyberPurple hover:brightness-125 border border-cyberPurpleBorder text-white cursor-pointer active:scale-[0.98]'
                    : 'bg-bgInput/50 border border-borderCard/40 text-textSub/40 cursor-not-allowed opacity-50 shadow-none'
                }`}
              >
                <BarChart2 className={`w-4 h-4 shrink-0 ${isArriboAvionValid ? 'text-white' : 'text-textSub/40'}`} />
                <span className="truncate">Carta Gantt</span>
              </button>
              <button
                type="button"
                onClick={handleOpenBriefingClick}
                className="w-full bg-cyberPurple hover:brightness-125 border border-cyberPurpleBorder text-white py-2.5 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                <FileText className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">Briefing</span>
              </button>
              <button
                type="button"
                onClick={onOpenGCEs}
                className="w-full bg-cyberPurple hover:brightness-125 border border-cyberPurpleBorder text-white py-2.5 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-[0.98]"
              >
                <Users className="w-4 h-4 text-white shrink-0" />
                <span className="truncate">GCEs</span>
              </button>
            </div>

            {/* PANEL DE HORARIOS */}
            <div className="grid grid-cols-[1fr_28%_1fr] gap-2 text-center items-stretch">
              {/* DEPARTURE */}
              <div className="border border-borderCard bg-bgCardHeader/30 rounded-2xl p-2 flex flex-col justify-between h-full space-y-1">
                <div>
                  <span className="text-[9px] font-bold text-textPrincipal uppercase tracking-wider block mb-1">
                    DEPARTURE
                  </span>
                  <div className="bg-bgInput border border-borderCard rounded-xl h-9 flex items-center justify-center">
                    <span className="text-base sm:text-lg font-black font-mono text-cyberGreen tracking-tight">
                      {flight.etd || '19:25'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-textPrincipal uppercase tracking-wider block mb-1">
                    REAL (ATD)
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenTimeModalAtd}
                    className="w-full bg-bgInput border border-borderCard rounded-xl h-9 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <span className="text-base sm:text-lg font-black font-mono text-cyberYellow">
                      {flight.atd || '--:--'}
                    </span>
                  </button>
                </div>
                <div className="h-4 flex items-center justify-center">
                  {depDelay !== null ? (
                    <span className={`text-xs font-black font-mono ${depDelay > 0 ? 'text-red-500' : 'text-cyberGreen'}`}>
                      {depDelay > 0 ? `+${depDelay} min` : depDelay < 0 ? `${depDelay} min` : 'On Time'}
                    </span>
                  ) : (
                    <span className="text-xs opacity-0">-</span>
                  )}
                </div>
              </div>

              {/* ON PISTA & TAT */}
              <div className="border border-borderCard bg-bgCardHeader/30 rounded-2xl p-2 flex flex-col justify-between h-full space-y-1">
                <div>
                  <span className="text-[8px] font-bold text-textPrincipal uppercase tracking-tight block mb-1">
                    ON (PISTA)
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenTimeModalOnPista}
                    className="w-full bg-bgInput border border-borderCard rounded-xl h-9 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <span className="text-xs sm:text-sm font-black font-mono text-cyberCyan">
                      {flight.onPista || '--:--'}
                    </span>
                  </button>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-textPrincipal uppercase tracking-wider block mb-1">
                    TAT
                  </span>
                  <div className="bg-bgInput border border-borderCard rounded-xl h-9 flex items-center justify-center">
                    <span className="text-base font-black font-mono text-cyberCoral">
                      {tatDisplay}
                    </span>
                  </div>
                </div>
                <div className="h-4 flex items-center justify-center">
                  {flight.spaxTime && Number(flight.totalPax) > 0 ? (
                    <span className="text-[10px] font-black font-mono text-cyberCyan tracking-tight italic">
                      SPAX: {flight.spaxTime}
                    </span>
                  ) : (
                    <span className="text-[10px] opacity-0">-</span>
                  )}
                </div>
              </div>

              {/* ARRIVAL */}
              <div className="border border-borderCard bg-bgCardHeader/30 rounded-2xl p-2 flex flex-col justify-between h-full space-y-1">
                <div>
                  <span className="text-[9px] font-bold text-textPrincipal uppercase tracking-wider block mb-1">
                    ARRIVAL
                  </span>
                  <div className="bg-bgInput border border-borderCard rounded-xl h-9 flex items-center justify-center">
                    <span className="text-base sm:text-lg font-black font-mono text-cyberGreen tracking-tight">
                      {flight.eta || '23:30'}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-textPrincipal uppercase tracking-wider block mb-1">
                    REAL (ATA)
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenTimeModalAta}
                    className="w-full bg-bgInput border border-borderCard rounded-xl h-9 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <span className="text-base sm:text-lg font-black font-mono text-cyberYellow">
                      {flight.ata || '--:--'}
                    </span>
                  </button>
                </div>
                <div className="h-4 flex items-center justify-center">
                  {arrDelay !== null ? (
                    <span className={`text-xs font-black font-mono ${arrDelay > 0 ? 'text-cyberCoral' : 'text-cyberGreen'}`}>
                      {arrDelay > 0 ? `+${arrDelay} min` : arrDelay < 0 ? `${arrDelay} min` : 'On Time'}
                    </span>
                  ) : (
                    <span className="text-xs opacity-0">-</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL INGRESAR PASAJEROS */}
      {isPaxModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-bgCard border border-borderCard w-full max-w-xs rounded-2xl p-4 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-borderCard pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-textPrincipal">
                Ingresar Total Pasajeros
              </h3>
              <button
                type="button"
                onClick={handleClosePaxModal}
                className="text-textSub hover:text-textMain p-1 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="bg-bgInput border border-borderCard rounded-xl p-3 flex items-center justify-center">
              <input
                type="number"
                autoFocus
                placeholder="0"
                value={paxInput === 0 || paxInput === '0' ? '' : paxInput}
                onFocus={(e) => e.target.select()}
                onChange={(e) => setPaxInput(e.target.value)}
                className="w-full bg-transparent text-center text-2xl font-black text-cyberYellow font-mono focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleClosePaxModal}
                className="flex-1 bg-bgCardHeader hover:bg-bgCard text-textSub border border-borderCard py-2 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePax}
                className="flex-1 bg-cyberPurple border border-cyberPurpleBorder text-white py-2 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALES REUTILIZABLES */}
      <TimePickerModal
        isOpen={modalState.isOpen}
        title={modalState.title}
        initialValue={modalState.value}
        onClose={closeTimeModal}
        onSave={handleSaveTime}
      />
      <SelectAircraftModal
        isOpen={isAircraftModalOpen}
        onClose={handleCloseAircraftModal}
        onSelect={handleSelectAircraft}
      />
    </>
  );
}

export default memo(FlightHeader);