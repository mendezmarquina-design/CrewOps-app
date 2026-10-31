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
import DocumentsLibraryView from './views/DocumentsLibraryView';
import GceManagementView from './views/GceManagementView';
import FlightBriefingView from './components/flight-itinerary/FlightBriefingView';
import FlightGanttView from './components/flight-itinerary/FlightGanttView';

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState('flights');
  
  // Estados de navegación y selección
  const [selectedBriefingFlight, setSelectedBriefingFlight] = useState(null);
  const [selectedGanttFlight, setSelectedGanttFlight] = useState(null);
  const [activeGceFlight, setActiveGceFlight] = useState(null);
  
  // Guarda siempre el vuelo activo seleccionado
  const [lastActiveFlight, setLastActiveFlight] = useState(null);
  
  // ✨ NUEVO: Estado para el vuelo que se va a editar desde doble click
  const [flightToEdit, setFlightToEdit] = useState(null);

  const handleFlightChange = useCallback((flight) => {
    if (flight) {
      setLastActiveFlight(flight);
    }
  }, []);

  const handleUpdateFlight = useCallback((updatedFlight) => {
    if (!updatedFlight) return;
    setLastActiveFlight(updatedFlight);
    setSelectedGanttFlight((prev) => (prev?.id === updatedFlight.id ? updatedFlight : prev));
    setSelectedBriefingFlight((prev) => (prev?.id === updatedFlight.id ? updatedFlight : prev));
  }, []);

  const goToFlights = () => {
    setSelectedBriefingFlight(null);
    setSelectedGanttFlight(null);
    setFlightToEdit(null); // ✨ Limpiar vuelo a editar al volver
    setCurrentTab('flights');
  };

  const goToItinerary = () => {
    setFlightToEdit(null); // ✨ Asegurar que no haya vuelo pre-cargado si es uno nuevo
    setCurrentTab('itinerary');
  };

  // ✨ NUEVO: Handler para el doble click en FlightSelector
  const handleDoubleClickFlight = (flight) => {
    console.log("✏️ Abriendo gestión para editar:", flight.flightNumber);
    setFlightToEdit(flight);
    setCurrentTab('itinerary');
  };

  // ✨ NUEVO: Handler para volver desde Gestión de Itinerarios
  const handleBackFromManagement = (returnToFlightId) => {
    setCurrentTab('flights');
    setFlightToEdit(null);
    // Si hay un ID de retorno, nos aseguramos de que sea el activo
    if (returnToFlightId && lastActiveFlight?.id !== returnToFlightId) {
      // Opcional: Si necesitas buscar el vuelo en la DB para restaurarlo, hazlo aquí.
      // Por ahora, confiamos en que lastActiveFlight ya tiene el contexto correcto.
    }
  };

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
            setFlightToEdit(null); // ✨ Limpiar al cambiar de pestaña desde el menú
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
                  onDoubleClickFlight={handleDoubleClickFlight} // ✨ CONEXIÓN CLAVE
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
              {currentTab === 'library' && (
                <DocumentsLibraryView onBack={goToFlights} />
              )}
              {currentTab === 'aircrafts' && (
                <AircraftManagementView onBackToFlights={goToFlights} />
              )}
              
              {/* ✨ VISTA DE GESTIÓN DE ITINERARIOS (Con soporte para edición) */}
              {(currentTab === 'itinerary' || currentTab === 'itineraries') && (
                <ItineraryManagementView 
                  onBack={handleBackFromManagement} // ✨ CONEXIÓN CLAVE
                  flightToEdit={flightToEdit}       // ✨ CONEXIÓN CLAVE
                />
              )}

              {/* Fallback para tabs no implementados */}
              {currentTab !== 'flights' && 
               currentTab !== 'reports' && 
               currentTab !== 'gce' && 
               currentTab !== 'documents' && 
               currentTab !== 'briefing' && 
               currentTab !== 'library' && 
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