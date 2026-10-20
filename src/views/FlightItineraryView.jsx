import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, Loader2 } from 'lucide-react';
import { useFlightItinerary } from '../hooks/useFlightItinerary';

import FlightSelector from '../components/flight-itinerary/FlightSelector';
import FlightHeader from '../components/flight-itinerary/FlightHeader';
import PreflightCard from '../components/flight-itinerary/PreflightCard';
import DepartureCard from '../components/flight-itinerary/DepartureCard';
import LandingCard from '../components/flight-itinerary/LandingCard';
import PostflightCard from '../components/flight-itinerary/PostflightCard';
import CreateReportCard from '../components/flight-itinerary/CreateReportCard';
import SpndCard from '../components/common/SpndCard';
import StickyFlightBar from '../components/common/StickyFlightBar';

const getTodayStringISO = () => {
  return new Date().toISOString().split('T')[0];
};

export default function FlightItineraryView({ 
  activeFlightContext,
  onFlightChange,
  onNewFlight, 
  onOpenBriefing, 
  onOpenGce, 
  onOpenGantt
}) {
  const [selectedDate, setSelectedDate] = useState(() => {
    return activeFlightContext?.date || getTodayStringISO();
  });

  useEffect(() => {
    if (activeFlightContext?.date) {
      setSelectedDate(activeFlightContext.date);
    }
  }, [activeFlightContext?.date]);

  // Controlador unificado
  const itineraryController = useFlightItinerary(
    selectedDate,
    activeFlightContext?.id,
    onFlightChange,
    onOpenBriefing
  );

  const {
    dayFlights,
    currentFlight,
    pinnedFlightId,
    setSelectedFlightId,
    togglePin,
    isLoading,
    handleUpdateFlightField,
    deleteReportModal,
    openDeleteReportModal,
    closeDeleteReportModal,
    handleConfirmDeleteReport
  } = itineraryController;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] text-textSub space-y-3">
        <Loader2 className="w-7 h-7 animate-spin text-cyberCyan" />
        <span className="text-xs font-bold uppercase tracking-wider">Cargando itinerario...</span>
      </div>
    );
  }

  const hasFlights = dayFlights.length > 0 && currentFlight !== null;

  return (
    <div className="space-y-4 max-w-xl mx-auto font-sans text-textMain relative pb-8">
      
      {/* BARRA PEGAJOSA */}
      {hasFlights && <StickyFlightBar flight={currentFlight} />}

      {/* SELECTOR DE VUELOS */}
      <FlightSelector
        selectedFlight={currentFlight}
        selectedDate={selectedDate}
        dayFlights={dayFlights}
        pinnedFlightId={pinnedFlightId}
        onDateChange={setSelectedDate}
        onSelectFlight={setSelectedFlightId}
        onTogglePin={togglePin}
        onNewFlight={onNewFlight}
      />

      {/* CONTENIDO PRINCIPAL */}
      {hasFlights ? (
        <>
          <FlightHeader
            flight={currentFlight}
            itineraryController={itineraryController}
            onOpenBriefing={onOpenBriefing}
            onOpenGantt={(flightData) => onOpenGantt && onOpenGantt(flightData || currentFlight)}
            onOpenGCEs={() => onOpenGce && onOpenGce(currentFlight)}
            isPinned={String(pinnedFlightId) === String(currentFlight.id)}
            onTogglePin={() => togglePin(currentFlight.id)}
          />

          <SpndCard
            spndList={currentFlight.spndList || []}
            onSaveSpnd={(updatedSpndList) => handleUpdateFlightField('spndList', updatedSpndList)}
            collapsible={true}
            defaultOpen={false}
          />

          <PreflightCard
            flightData={currentFlight}
            onUpdateFlight={handleUpdateFlightField}
            defaultOpen={false}
          />

          <DepartureCard
            flightData={currentFlight}
            onUpdateFlight={handleUpdateFlightField}
            defaultOpen={true}
          />

          <LandingCard
            flightData={currentFlight}
            onUpdateFlight={handleUpdateFlightField}
            defaultOpen={true}
          />

          <CreateReportCard
            flightData={currentFlight}
            onUpdateFlight={handleUpdateFlightField}
            onDeleteReport={(reportTarget) => openDeleteReportModal(reportTarget)}
          />

          <PostflightCard
            flightData={currentFlight}
            onUpdateFlight={handleUpdateFlightField}
            defaultOpen={false}
          />
        </>
      ) : (
        <div className="bg-bgCard border border-borderCard rounded-2xl p-4 text-center space-y-4 shadow-sm transition-colors duration-200 animate-in fade-in">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-cyberCyan/10 border border-cyberCyan/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-cyberCyan" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-black uppercase text-textMain tracking-wider">
              Sin vuelos en esta fecha
            </h3>
            <p className="text-xs text-textSub max-w-xs mx-auto leading-relaxed">
              No hay vuelos registrados para el día seleccionado. Cambia la fecha o crea un nuevo vuelo.
            </p>
          </div>
        </div>
      )}

      {/* MODAL DE ELIMINACIÓN DE REPORTES (CONTROLADO POR EL HOOK) */}
      {deleteReportModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-bgCard border border-red-500/40 w-full max-w-xs rounded-2xl p-5 shadow-sm space-y-4 text-center">
            <div className="w-10 h-10 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto text-red-400">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div>
              <h3 className="text-xs font-black uppercase text-textMain tracking-wider">
                ¿Eliminar Reporte?
              </h3>
              <p className="text-xs text-textSub mt-1 leading-relaxed">
                Esta acción eliminará el reporte seleccionado del vuelo actual.
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={closeDeleteReportModal}
                className="flex-1 bg-bgInput hover:bg-bgCard text-textSub font-bold py-2 rounded-xl text-xs cursor-pointer border border-borderCard transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteReport}
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2 rounded-xl text-xs transition-all cursor-pointer shadow-sm uppercase tracking-wider"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}