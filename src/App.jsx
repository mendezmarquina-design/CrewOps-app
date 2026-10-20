// App.jsx
import React, { useState, useCallback } from 'react';
import { ThemeProvider } from './contex/ThemeContext';
import Header from './components/layout/Header';
import Sidebar from './components/layout/Sidebar';
import FlightItineraryView from './views/FlightItineraryView';
import AircraftManagementView from './views/AircraftManagementView';
import ItineraryManagementView from './views/ItineraryManagementView';
import ReportManagementView from './views/ReportManagementView';
import DocumentSearchView from './views/DocumentSearchView';
import GceManagementView from './views/GceManagementView';
import FlightBriefingView from './components/flight-itinerary/FlightBriefingView';
import FlightGanttView from './components/flight-itinerary/FlightGanttView';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('flights');
  
  const [selectedBriefingFlight, setSelectedBriefingFlight] = useState(null);
  const [selectedGanttFlight, setSelectedGanttFlight] = useState(null);
  const [activeGceFlight, setActiveGceFlight] = useState(null);

  // Guarda siempre el vuelo activo seleccionado
  const [lastActiveFlight, setLastActiveFlight] = useState(null);

  const handleFlightChange = useCallback((flight) => {
    if (flight) {
      setLastActiveFlight(flight);
    }
  }, []);

  // FUNCIÓN MAESTRA: Actualiza los datos del vuelo en todo el flujo de la App
  const handleUpdateFlight = useCallback((updatedFlight) => {
    if (!updatedFlight) return;
    setLastActiveFlight(updatedFlight);
    setSelectedGanttFlight((prev) => (prev?.id === updatedFlight.id ? updatedFlight : prev));
    setSelectedBriefingFlight((prev) => (prev?.id === updatedFlight.id ? updatedFlight : prev));
  }, []);

  const goToFlights = () => {
    setSelectedBriefingFlight(null);
    setSelectedGanttFlight(null);
    setCurrentTab('flights');
  };

  const goToItinerary = () => setCurrentTab('itinerary');

  const handleOpenGceForFlight = (flight) => {
    const targetFlight = flight || lastActiveFlight;
    setActiveGceFlight(targetFlight);
    if (targetFlight) setLastActiveFlight(targetFlight);
    setCurrentTab('gce');
  };

  const handleOpenBriefingForFlight = (flight) => {
    const targetFlight = flight || lastActiveFlight;
    setSelectedBriefingFlight(targetFlight);
    if (targetFlight) setLastActiveFlight(targetFlight);
  };

  const handleOpenGanttForFlight = (flight) => {
    const targetFlight = flight || lastActiveFlight;
    setSelectedGanttFlight(targetFlight);
    if (targetFlight) setLastActiveFlight(targetFlight);
  };

  return (
    <ThemeProvider>
      <div className="font-sans selection:bg-accentBlue selection:text-white">
        <Header onOpenMenu={() => setIsSidebarOpen(true)} />

        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setSelectedBriefingFlight(null);
            setSelectedGanttFlight(null);
            if (tab === 'gce') setActiveGceFlight(null);
            setCurrentTab(tab);
          }}
        />

        <main className="p-4 max-w-md mx-auto space-y-4">
          {/* VISTA DE BRIEFING */}
          {currentTab === 'flights' && selectedBriefingFlight ? (
            <FlightBriefingView 
              flight={selectedBriefingFlight} 
              onBack={goToFlights} 
            />
          ) : currentTab === 'flights' && selectedGanttFlight ? (
            /* VISTA DE CARTA GANTT */
            <FlightGanttView 
              flight={selectedGanttFlight} 
              onBack={goToFlights}
              onUpdateFlight={handleUpdateFlight}
            />
          ) : (
            <>
              {/* VISTA CONTROL DE VUELOS */}
              {currentTab === 'flights' && (
                <FlightItineraryView 
                  activeFlightContext={lastActiveFlight}
                  onFlightChange={handleFlightChange}
                  onNewFlight={goToItinerary} 
                  onOpenBriefing={handleOpenBriefingForFlight}
                  onOpenGce={handleOpenGceForFlight}
                  onOpenGantt={handleOpenGanttForFlight}
                  onUpdateFlight={handleUpdateFlight}
                />
              )}
              
              {/* RESTO DE VISTAS */}
              {currentTab === 'reports' && (
                <ReportManagementView onBack={goToFlights} />
              )}

              {currentTab === 'gce' && (
                <GceManagementView 
                  activeFlight={activeGceFlight} 
                  onBack={goToFlights} 
                />
              )}

              {(currentTab === 'documents' || currentTab === 'briefing') && (
                <DocumentSearchView onBackToFlights={goToFlights} />
              )}

              {currentTab === 'aircrafts' && (
                <AircraftManagementView onBackToFlights={goToFlights} />
              )}

              {(currentTab === 'itinerary' || currentTab === 'itineraries') && (
                <ItineraryManagementView onBack={goToFlights} />
              )}

              {currentTab !== 'flights' && 
               currentTab !== 'reports' && 
               currentTab !== 'gce' && 
               currentTab !== 'documents' && 
               currentTab !== 'briefing' && 
               currentTab !== 'aircrafts' && 
               currentTab !== 'itinerary' && 
               currentTab !== 'itineraries' && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={goToFlights}
                    className="w-full bg-bgCardHeader hover:bg-bgSidebar border border-accentBlue/30 text-accentBlue py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                  >
                    <span>Volver a Control de Vuelos</span>
                  </button>
                  
                  <div className="bg-bgCard border border-border-color rounded-2xl p-6 text-center text-sub text-xs">
                    Vista de <span className="text-accentBlue font-bold uppercase">{currentTab}</span> en construcción.
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </ThemeProvider>
  );
}