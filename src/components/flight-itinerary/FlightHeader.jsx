import React from 'react';
import { FileText, BarChart2, Users, X } from 'lucide-react';
import TimePickerModal from '../modals/TimePickerModal';
import SelectAircraftModal from '../modals/SelectAircraftModal';
import { calculateDelay } from '../../utils/flightUtils';

export default function FlightHeader({ 
  flight, 
  itineraryController,
  onOpenBriefing, 
  onOpenGantt, 
  onOpenGCEs 
}) {
  if (!flight) return null;

  // Extraemos las acciones y estados del controlador recibido desde la vista padre
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

  // Validación: Comprobar si el valor de Arribo Avión es válido
  const isArriboAvionValid = Boolean(
    flight.arriboAvion && 
    flight.arriboAvion !== '--:--' && 
    flight.arriboAvion.trim() !== ''
  );

  // Cálculo de demoras mediante la función auxiliar externa
  const depDelay = calculateDelay(flight.etd || '19:25', flight.atd);
  const arrDelay = calculateDelay(flight.eta || '23:30', flight.ata);

  return (
    <>
      <div className="bg-bgCard border border-borderCard rounded-2xl p-4 space-y-3 shadow-sm max-w-md mx-auto">
        
        {/* FILA SUPERIOR: Vuelo, Ruta, Matrícula */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] font-bold text-textPrincipal uppercase tracking-wider block mb-1">
              VUELO
            </span>
            <div className="bg-bgInput border border-borderCard rounded-xl h-9 flex items-center justify-center px-1">
              <span className="text-base font-black text-cyberCoral font-mono tracking-wider italic">
                {flightPrefix}
                {flightNumberOnly || '777'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-textPrincipal uppercase tracking-wider block mb-1">
              RUTA / TRAMO
            </span>
            <div className="bg-bgInput border border-borderCard rounded-xl h-9 flex items-center justify-center">
              <span className="text-sm font-black font-mono text-cyberCyan tracking-wider">
                {flight.route || 'LEW-W'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold text-textPrincipal uppercase tracking-wider block mb-1">
              MATRÍCULA
            </span>
            <button
              type="button"
              onClick={() => setIsAircraftModalOpen(true)}
              className="w-full bg-bgInput hover:bg-bgCardHeader border border-borderCard hover:border-cyberCyan/50 rounded-xl h-9 flex items-center justify-center transition-all cursor-pointer"
            >
              <span className="text-sm font-black font-mono text-cyberYellow tracking-wider">
                {flight.tailNumber || 'PS-LAA'}
              </span>
            </button>
          </div>
        </div>

        {/* TRIPLE BOTÓN DE ACCIÓN */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={!isArriboAvionValid}
            onClick={() => isArriboAvionValid && onOpenGantt && onOpenGantt(flight)}
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
            onClick={() => onOpenBriefing && onOpenBriefing(flight)}
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

        {/* PANEL DE HORARIOS Y PAX */}
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
                onClick={() => openTimeModal('REAL (ATD)', 'atd', flight.atd)}
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

          {/* ON PISTA & TOTAL PAX / SPAX */}
          <div className="border border-borderCard bg-bgCardHeader/30 rounded-2xl p-2 flex flex-col justify-between h-full space-y-1">
            <div>
              <span className="text-[8px] font-bold text-textPrincipal uppercase tracking-tight block mb-1">
                ON (PISTA)
              </span>
              <button
                type="button"
                onClick={() => openTimeModal('ON (PISTA)', 'onPista', flight.onPista)}
                className="w-full bg-bgInput border border-borderCard rounded-xl h-9 flex items-center justify-center transition-all cursor-pointer"
              >
                <span className="text-xs sm:text-sm font-black font-mono text-cyberCyan">
                  {flight.onPista || '--:--'}
                </span>
              </button>
            </div>

            <div>
              <span className="text-[9px] font-bold text-textPrincipal uppercase tracking-wider block mb-1">
                TOTAL PAX
              </span>
              <button
                type="button"
                onClick={() => setIsPaxModalOpen(true)}
                className="w-full bg-bgInput border border-borderCard rounded-xl h-9 flex items-center justify-center transition-all shadow-sm cursor-pointer"
              >
                <span className="text-base font-black font-mono text-cyberYellow">
                  {flight.totalPax ?? 0}
                </span>
              </button>
            </div>

            <div className="h-4 flex items-center justify-center">
              {Boolean(flight.spaxTime && Number(flight.totalPax) > 0) ? (
                <span className="text-tiny font-black font-mono text-cyberCyan tracking-tight italic">
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
                onClick={() => openTimeModal('REAL (ATA)', 'ata', flight.ata)}
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
                onClick={() => setIsPaxModalOpen(false)}
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
                onClick={() => setIsPaxModalOpen(false)}
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
        onClose={() => setIsAircraftModalOpen(false)}
        onSelect={handleSelectAircraft}
      />
    </>
  );
}