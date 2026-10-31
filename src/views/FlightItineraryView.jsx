import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, AlertCircle, Loader2, BarChart2, FileText, Users } from 'lucide-react';
import { useFlightItinerary } from '../hooks/useFlightItinerary';
import FlightSelector from '../components/flight-itinerary/FlightSelector';
import FlightHeader from '../components/flight-itinerary/FlightHeader';
import ArrivalAlert from '../components/flight-itinerary/ArrivalAlert';
import PreflightCard from '../components/flight-itinerary/PreflightCard';
import DepartureCard from '../components/flight-itinerary/DepartureCard';
import LandingCard from '../components/flight-itinerary/LandingCard';
import PostflightCard from '../components/flight-itinerary/PostflightCard';
import CreateReportCard from '../components/flight-itinerary/CreateReportCard';
import FlightReportsCard from '../components/common/FlightReportsCard';
import SpndCard from '../components/common/SpndCard';
import StickyFlightBar from '../components/common/StickyFlightBar';
import AlarmModal from '../components/common/AlarmModal';
import AlarmOverlay from '../components/common/AlarmOverlay';
import { EditReportModal } from '../components/reports';
import { triggerImmediateAlarm } from '../utils/doorCloseAlarm';

const getTodayStringISO = () => new Date().toISOString().split('T')[0];

export default function FlightItineraryView({
  activeFlightContext,
  onFlightChange,
  onNewFlight,
  onOpenBriefing,
  onOpenGce,
  onOpenGantt,
  onDoubleClickFlight
}) {
  const [selectedDate, setSelectedDate] = useState(() => {
    return activeFlightContext?.date || getTodayStringISO();
  });

  const [editingReport, setEditingReport] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [showFullScreenAlarm, setShowFullScreenAlarm] = useState(false);

  const triggeredAlarmsRef = useRef(new Set());
  const lastCierrePuertasRef = useRef(null);

  useEffect(() => {
    if (activeFlightContext?.date) {
      setSelectedDate(activeFlightContext.date);
    }
  }, [activeFlightContext?.date]);

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

  // ✅ Verificar si hay arribo de avión válido
  const isArriboAvionValid = Boolean(
    currentFlight?.arriboAvion &&
    currentFlight.arriboAvion !== '--:--' &&
    currentFlight.arriboAvion.trim() !== ''
  );

  // Handlers para los botones de acción
  const handleOpenGanttClick = () => {
    if (isArriboAvionValid && onOpenGantt) {
      onOpenGantt(currentFlight);
    }
  };

  const handleOpenBriefingClick = () => {
    if (onOpenBriefing) onOpenBriefing(currentFlight);
  };

  const handleOpenGceClick = () => {
    if (onOpenGce) onOpenGce(currentFlight);
  };

  useEffect(() => {
    const cierrePuertas = currentFlight?.cierrePuerta || currentFlight?.cierrePuertasTime;
    if (!cierrePuertas || cierrePuertas === '--:--' || !currentFlight?.id) {
      lastCierrePuertasRef.current = null;
      triggeredAlarmsRef.current = new Set();
      setShowFullScreenAlarm(false);
      return;
    }
    if (lastCierrePuertasRef.current === cierrePuertas) return;
    lastCierrePuertasRef.current = cierrePuertas;
    triggeredAlarmsRef.current = new Set();
    setShowFullScreenAlarm(false);
    const [hours, minutes] = cierrePuertas.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;
    console.log(`⏰ Reloj iniciado para ${currentFlight.flightNumber} - Cierre: ${cierrePuertas}`);
    const intervalId = setInterval(() => {
      const alarmEnabled = localStorage.getItem('doorCloseAlarm') === 'true';
      const savedMinutes = localStorage.getItem('alarmMinutesList');
      const alarmMinutes = savedMinutes ? JSON.parse(savedMinutes) : [5, 15];
      if (!alarmEnabled || alarmMinutes.length === 0) return;
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      for (const minBefore of alarmMinutes) {
        const alarmMinutesTotal = hours * 60 + (minutes - minBefore);
        const normalizedAlarmMinutes = alarmMinutesTotal < 0 ? alarmMinutesTotal + 1440 : alarmMinutesTotal;
        const diff = nowMinutes - normalizedAlarmMinutes;
        const alarmKey = `${currentFlight.id}-${minBefore}`;
        if (diff >= 0 && diff < 1 && !triggeredAlarmsRef.current.has(alarmKey)) {
          console.log(`🚨 ALARMA DISPARADA: ${minBefore} min antes de ${cierrePuertas}`);
          triggeredAlarmsRef.current.add(alarmKey);
          triggerImmediateAlarm();
          setShowFullScreenAlarm(true);
        }
      }
    }, 5000);
    return () => {
      clearInterval(intervalId);
      console.log('⏰ Reloj detenido');
    };
  }, [currentFlight?.id, currentFlight?.cierrePuerta, currentFlight?.cierrePuertasTime]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkPendingAlarms();
      }
    };
    const checkPendingAlarms = () => {
      const cierrePuertas = currentFlight?.cierrePuerta || currentFlight?.cierrePuertasTime;
      const alarmEnabled = localStorage.getItem('doorCloseAlarm') === 'true';
      const savedMinutes = localStorage.getItem('alarmMinutesList');
      const alarmMinutes = savedMinutes ? JSON.parse(savedMinutes) : [5, 15];
      if (!alarmEnabled || !cierrePuertas || cierrePuertas === '--:--' || !currentFlight?.id) return;
      const [hours, minutes] = cierrePuertas.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) return;
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      for (const minBefore of alarmMinutes) {
        const alarmMinutesTotal = hours * 60 + (minutes - minBefore);
        const normalizedAlarmMinutes = alarmMinutesTotal < 0 ? alarmMinutesTotal + 1440 : alarmMinutesTotal;
        const diff = nowMinutes - normalizedAlarmMinutes;
        const alarmKey = `${currentFlight.id}-${minBefore}`;
        if (diff >= -5 && diff < 1 && !triggeredAlarmsRef.current.has(alarmKey)) {
          triggeredAlarmsRef.current.add(alarmKey);
          triggerImmediateAlarm();
          setShowFullScreenAlarm(true);
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    const handleNotificationClick = (event) => {
      triggerImmediateAlarm();
      setShowFullScreenAlarm(true);
    };
    window.addEventListener('alarmNotificationClick', handleNotificationClick);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('alarmNotificationClick', handleNotificationClick);
    };
  }, [currentFlight?.id, currentFlight?.cierrePuerta, currentFlight?.cierrePuertasTime]);

  const handleToggleReportComplete = (index) => {
    const reports = [...(currentFlight?.reports || [])];
    if (reports[index]) {
      reports[index].completed = !reports[index].completed;
      handleUpdateFlightField('reports', reports);
    }
  };

  const handleOpenEditReport = (report, index) => {
    setEditingReport({
      ...report,
      flightNumber: currentFlight?.flightNumber || 'N/A',
      route: currentFlight?.route || 'N/A'
    });
    setEditingIndex(index);
  };

  const handleSaveEditedReport = (updatedReport) => {
    if (editingIndex === null) return;
    const currentReports = [...(currentFlight?.reports || [])];
    currentReports[editingIndex] = updatedReport;
    handleUpdateFlightField('reports', currentReports);
    setEditingReport(null);
    setEditingIndex(null);
  };

  const handleDeleteFromEditModal = () => {
    if (editingIndex !== null) {
      openDeleteReportModal(editingIndex);
      setEditingReport(null);
      setEditingIndex(null);
    }
  };

  return (
    <div className="space-y-4 max-w-xl mx-auto font-sans text-textMain relative pb-8">
      {showFullScreenAlarm && (
        <AlarmOverlay
          flightNumber={currentFlight?.flightNumber}
          cierrePuertasTime={currentFlight?.cierrePuerta || currentFlight?.cierrePuertasTime}
          onDismiss={() => setShowFullScreenAlarm(false)}
        />
      )}

      <StickyFlightBar
        flight={currentFlight}
        onOpenAlarmModal={() => setIsAlarmModalOpen(true)}
      />

      <FlightSelector
        selectedFlight={currentFlight}
        selectedDate={selectedDate}
        dayFlights={dayFlights}
        pinnedFlightId={pinnedFlightId}
        onDateChange={setSelectedDate}
        onSelectFlight={setSelectedFlightId}
        onTogglePin={togglePin}
        onNewFlight={onNewFlight}
        onDoubleClickFlight={onDoubleClickFlight}
      />

      {/* ✅ ALERTA DE ARRIBO O BOTONES DE ACCIÓN (mutuamente excluyentes) */}
      {hasFlights && (
        isArriboAvionValid ? (
          //  BOTONES DE ACCIÓN (aparecen cuando hay arriboAvion)
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleOpenGanttClick}
              className="bg-cyberPurple hover:brightness-125 border border-cyberPurpleBorder text-white py-2.5 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <BarChart2 className="w-4 h-4 text-white shrink-0" />
              <span className="truncate">Carta Gantt</span>
            </button>
            <button
              type="button"
              onClick={handleOpenBriefingClick}
              className="bg-cyberPurple hover:brightness-125 border border-cyberPurpleBorder text-white py-2.5 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <FileText className="w-4 h-4 text-white shrink-0" />
              <span className="truncate">Briefing</span>
            </button>
            <button
              type="button"
              onClick={handleOpenGceClick}
              className="bg-cyberPurple hover:brightness-125 border border-cyberPurpleBorder text-white py-2.5 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer active:scale-[0.98]"
            >
              <Users className="w-4 h-4 text-white shrink-0" />
              <span className="truncate">GCEs</span>
            </button>
          </div>
        ) : (
          // ️ ALERTA DE ARRIBO (aparece cuando NO hay arriboAvion)
          <ArrivalAlert
            flight={currentFlight}
            onUpdateFlight={handleUpdateFlightField}
          />
        )
      )}

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
            onOpenAlarmModal={() => setIsAlarmModalOpen(true)}
          />
          <SpndCard
            spndList={currentFlight.spndList || []}
            onSaveSpnd={(updatedSpndList) => handleUpdateFlightField('spndList', updatedSpndList)}
            collapsible={true}
            defaultOpen={false}
          />
          <FlightReportsCard
            reports={currentFlight?.reports || []}
            onToggleComplete={handleToggleReportComplete}
            onEditReport={handleOpenEditReport}
            onDeleteReport={(index) => openDeleteReportModal(index)}
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

      <EditReportModal
        isOpen={!!editingReport}
        initialData={editingReport}
        onClose={() => {
          setEditingReport(null);
          setEditingIndex(null);
        }}
        onSave={handleSaveEditedReport}
        onDelete={handleDeleteFromEditModal}
      />

      <AlarmModal
        isOpen={isAlarmModalOpen}
        flight={currentFlight}
        cierrePuertasTime={currentFlight?.cierrePuerta || currentFlight?.cierrePuertasTime}
        onClose={() => setIsAlarmModalOpen(false)}
      />
    </div>
  );
}