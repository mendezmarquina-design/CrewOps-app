import { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { 
  resolveActiveFlight, 
  createFlightUpdatePayload 
} from '../utils/flightUtils';

const getCurrentTimeString = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export function useFlightItinerary(
  selectedDate,
  externalSelectedFlightId = null,
  onFlightChange = null,
  onOpenBriefing = null
) {
  // ---------------------------------------------------------------------------
  // 1. ESTADOS DE NAVEGACIÓN Y SELECCIÓN DE VUELO
  // ---------------------------------------------------------------------------
  const [selectedFlightId, setSelectedFlightId] = useState(externalSelectedFlightId);
  const [pinnedFlightId, setPinnedFlightId] = useState(null);

  const lastExternalIdRef = useRef(externalSelectedFlightId);
  const lastNotifiedSignatureRef = useRef(null);

  // ---------------------------------------------------------------------------
  // 2. ESTADOS LOCALES DE INTERFAZ, MODALES Y FORMULARIOS
  // ---------------------------------------------------------------------------
  const [isAircraftModalOpen, setIsAircraftModalOpen] = useState(false);
  const [isPaxModalOpen, setIsPaxModalOpen] = useState(false);
  const [paxInput, setPaxInput] = useState(0);

  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    field: '',
    value: ''
  });

  const [deleteReportModal, setDeleteReportModal] = useState({
    isOpen: false,
    reportTarget: null // Puede ser un ID o un índice
  });

  // ---------------------------------------------------------------------------
  // 3. SINCRONIZACIÓN EXTERNA Y CONSULTA REACTIVA EN DEXIE DB
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (externalSelectedFlightId !== null && externalSelectedFlightId !== undefined) {
      lastExternalIdRef.current = externalSelectedFlightId;
      setSelectedFlightId(externalSelectedFlightId);
    }
  }, [externalSelectedFlightId]);

  // Resetear selección manual al cambiar de fecha
  useEffect(() => {
    setSelectedFlightId(null);
  }, [selectedDate]);

  // Consulta reactiva a Dexie DB
  const safeAllFlights = useLiveQuery(
    async () => {
      const results = await db.flights.toArray();
      return results.sort((a, b) => (a.etd || '00:00').localeCompare(b.etd || '00:00'));
    },
    [],
    []
  );

  const isLoading = safeAllFlights === undefined;
  const dayFlights = (safeAllFlights || []).filter((f) => f.date === selectedDate);

  // ---------------------------------------------------------------------------
  // 4. DETERMINACIÓN DEL VUELO ACTUAL ACTIVO (Usando helper puro)
  // ---------------------------------------------------------------------------
  const currentFlight = resolveActiveFlight(
    dayFlights,
    selectedFlightId ?? lastExternalIdRef.current,
    pinnedFlightId,
    getCurrentTimeString()
  );

  // Notificar al padre solo si firma (ID + updatedAt) cambia realmente
  const currentFlightId = currentFlight?.id || null;
  const currentFlightUpdatedAt = currentFlight?.updatedAt || null;

  useEffect(() => {
    if (!currentFlight || !onFlightChange) return;

    const signature = `${currentFlightId}_${currentFlightUpdatedAt}`;
    if (lastNotifiedSignatureRef.current !== signature) {
      lastNotifiedSignatureRef.current = signature;
      onFlightChange(currentFlight);
    }
  }, [currentFlightId, currentFlightUpdatedAt, currentFlight, onFlightChange]);

  // Mantener paxInput siempre sincronizado con el vuelo activo
  useEffect(() => {
    if (currentFlight) {
      setPaxInput(currentFlight.totalPax || 0);
    }
  }, [currentFlight?.id, currentFlight?.totalPax]);

  // ---------------------------------------------------------------------------
  // 5. PARSEO DEL NÚMERO DE VUELO
  // ---------------------------------------------------------------------------
  const rawFlightNumber = (currentFlight?.flightNumber || '').replace(/\s+/g, '');
  const match = rawFlightNumber.match(/^([A-Za-z]+)(\d+)$/);
  const flightPrefix = match ? match[1] : '';
  const flightNumberOnly = match ? match[2] : rawFlightNumber;

  // ---------------------------------------------------------------------------
  // 6. MANEJADORES DE PERSISTENCIA Y EVENTOS (DEXIE)
  // ---------------------------------------------------------------------------

  // Actualizador polimórfico directo a Dexie DB usando helper unificado de payload
  const handleUpdateFlightField = async (fieldOrUpdates, value) => {
    if (!currentFlight?.id) return;

    const rawUpdates = typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null
      ? fieldOrUpdates
      : { [fieldOrUpdates]: value };

    const updates = createFlightUpdatePayload(rawUpdates);

    try {
      await db.flights.update(currentFlight.id, updates);
    } catch (err) {
      console.error('Error actualizando campo en Dexie DB:', err);
    }
  };

  // Selección manual de vuelo y Pin
  const handleSelectFlight = (val) => {
    if (!val) {
      setSelectedFlightId(null);
      return;
    }
    const id = typeof val === 'object' ? val.id : val;
    setSelectedFlightId(id);
    lastExternalIdRef.current = id;
  };

  const togglePin = (flightId) => {
    const targetId = flightId || currentFlight?.id;
    if (!targetId) return;

    if (String(pinnedFlightId) === String(targetId)) {
      setPinnedFlightId(null);
    } else {
      setPinnedFlightId(targetId);
      setSelectedFlightId(targetId);
    }
  };

  // Modal de Tiempos
  const openTimeModal = (title, field, currentValue) => {
    setModalState({
      isOpen: true,
      title,
      field,
      value: currentValue || ''
    });
  };

  const closeTimeModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSaveTime = async (newValue) => {
    if (modalState.field) {
      await handleUpdateFlightField(modalState.field, newValue);
    }
    closeTimeModal();
  };

  // Guardar Pasajeros (PAX)
  const handleSavePax = async () => {
    const timeStamp = getCurrentTimeString();
    const updatedPax = parseInt(paxInput, 10) || 0;

    await handleUpdateFlightField({
      totalPax: updatedPax,
      spaxTime: timeStamp
    });

    setIsPaxModalOpen(false);
  };

  // Seleccionar Matrícula
  const handleSelectAircraft = async (selectedData) => {
    const tailNumber =
      typeof selectedData === 'object' && selectedData !== null
        ? selectedData.tailNumber || selectedData.registration || ''
        : selectedData;

    await handleUpdateFlightField('tailNumber', tailNumber);
    setIsAircraftModalOpen(false);
  };

  // Eliminación de Reportes (Soporta filtrado por ID o por índice)
  const openDeleteReportModal = (reportTarget) => {
    setDeleteReportModal({ isOpen: true, reportTarget });
  };

  const closeDeleteReportModal = () => {
    setDeleteReportModal({ isOpen: false, reportTarget: null });
  };

  const handleConfirmDeleteReport = async () => {
    if (!currentFlight?.id || deleteReportModal.reportTarget === null) return;

    const currentReports = currentFlight.reports || [];
    const target = deleteReportModal.reportTarget;

    const updatedReports = currentReports.filter((r, idx) => {
      if (typeof target === 'number') {
        return idx !== target;
      }
      return r.id !== target;
    });

    await handleUpdateFlightField('reports', updatedReports);
    closeDeleteReportModal();
  };

  return {
    // Datos y Selección
    dayFlights,
    allFlights: safeAllFlights || [],
    currentFlight,
    flight: currentFlight,
    selectedFlightId: currentFlight?.id || null,
    pinnedFlightId,
    isLoading,
    flightPrefix,
    flightNumberOnly,

    // Métodos de Selección y Persistencia
    setSelectedFlightId: handleSelectFlight,
    togglePin,
    handleUpdateFlightField,

    // Modal de Tiempos
    modalState,
    openTimeModal,
    closeTimeModal,
    handleSaveTime,

    // Modal de PAX
    isPaxModalOpen,
    setIsPaxModalOpen,
    paxInput,
    setPaxInput,
    handleSavePax,

    // Modal de Matrícula
    isAircraftModalOpen,
    setIsAircraftModalOpen,
    handleSelectAircraft,

    // Modal de Eliminación de Reportes
    deleteReportModal,
    openDeleteReportModal,
    closeDeleteReportModal,
    handleConfirmDeleteReport,

    // Navegación
    handleOpenBriefing: () => onOpenBriefing && currentFlight && onOpenBriefing(currentFlight)
  };
}