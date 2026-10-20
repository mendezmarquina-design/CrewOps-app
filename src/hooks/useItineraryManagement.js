import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

// ---------------------------------------------------------------------------
// 1. CONSTANTES Y UTILIDADES (fuera del hook, no se recrean)
// ---------------------------------------------------------------------------
const defaultAircrafts = [
  { tailNumber: 'CC-BBA', model: '787-9', notes: 'Crew Rest Modificado' },
  { tailNumber: 'CC-BER', model: 'A321', notes: 'Air Berlin' },
  { tailNumber: 'CC-BHZ', model: 'A320', notes: 'A320-NEO, Nueva Cabina' },
];

// Fechas actuales (calculadas una sola vez al cargar el módulo)
const TODAY = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];
const CURRENT_MONTH_STR = TODAY.toISOString().slice(0, 7);
const CURRENT_YEAR_STR = TODAY.getFullYear().toString();

// Estado inicial del formulario (fuera del hook para no recrearlo)
const initialFormState = {
  date: TODAY_STR,
  flightNumber: 'LA',
  route: '',
  tailNumber: '',
  etd: '',
  eta: ''
};

// Helper puro para formatear fechas
export const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

// Función pura para formatear número de vuelo
const formatFlightNumber = (val) => {
  let clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (!clean.startsWith('LA')) clean = 'LA' + clean.replace(/^[A-Z]*/, '');
  const prefix = clean.slice(0, 2);
  const digits = clean.slice(2).replace(/\D/g, '').slice(0, 4);
  return prefix + digits;
};

// Función pura para formatear ruta
const formatRoute = (val) => {
  let clean = val.toUpperCase().replace(/[^A-Z]/g, '');
  if (clean.length > 6) clean = clean.slice(0, 6);
  if (clean.length > 3) return `${clean.slice(0, 3)}-${clean.slice(3)}`;
  return clean;
};

// Generador de UUID con fallback
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback para entornos sin crypto.randomUUID
  return 'flt-' + Math.random().toString(36).substring(2, 11);
};

// ---------------------------------------------------------------------------
// 2. HOOK PRINCIPAL
// ---------------------------------------------------------------------------
export function useItineraryManagement() {
  // ---------------------------------------------------------------------------
  // 2.1 ESTADOS AGRUPADOS
  // ---------------------------------------------------------------------------
  const [formData, setFormData] = useState(initialFormState);
  const [editingFlightId, setEditingFlightId] = useState(null);
  const [flightToDeleteId, setFlightToDeleteId] = useState(null);

  // Filtros
  const [filterMode, setFilterMode] = useState('month');
  const [filterDay, setFilterDay] = useState(TODAY_STR);
  const [filterMonth, setFilterMonth] = useState(CURRENT_MONTH_STR);
  const [filterYear, setFilterYear] = useState(CURRENT_YEAR_STR);
  const [filterFlight, setFilterFlight] = useState('');

  // Modales generales
  const [isTailModalOpen, setIsTailModalOpen] = useState(false);
  const [tailSearchQuery, setTailSearchQuery] = useState('');

  // Estado y Handlers para TimePickerModal
  const [timePickerConfig, setTimePickerConfig] = useState({
    isOpen: false,
    field: null, // 'etd' | 'eta'
    title: ''
  });

  // ---------------------------------------------------------------------------
  // 2.2 CONSULTA DE MATRÍCULAS
  // ---------------------------------------------------------------------------
  const aircraftList = useLiveQuery(async () => {
    if (!db.aircrafts) return defaultAircrafts;
    const list = await db.aircrafts.toArray();
    return list && list.length > 0 ? list : defaultAircrafts;
  }) || defaultAircrafts;

  // ---------------------------------------------------------------------------
  // 2.3 CONSULTA DE VUELOS OPTIMIZADA (con índices)
  // ---------------------------------------------------------------------------
  const flights = useLiveQuery(async () => {
    if (!db.flights) return [];
    
    let list;
    
    // Filtrar por fecha usando índices (mucho más rápido que toArray + filter)
    if (filterMode === 'day' && filterDay) {
      list = await db.flights.where('date').equals(filterDay).toArray();
    } else if (filterMode === 'month' && filterMonth) {
      // Para filtrar por mes, usamos between con el rango del mes
      const monthStart = `${filterMonth}-01`;
      const monthEnd = `${filterMonth}-31`; // Dexie maneja esto correctamente
      list = await db.flights.where('date').between(monthStart, monthEnd, true, true).toArray();
    } else if (filterMode === 'year' && filterYear) {
      const yearStart = `${filterYear}-01-01`;
      const yearEnd = `${filterYear}-12-31`;
      list = await db.flights.where('date').between(yearStart, yearEnd, true, true).toArray();
    } else {
      list = await db.flights.toArray();
    }

    // Filtrar por número de vuelo (si aplica)
    if (filterFlight) {
      const query = filterFlight.trim().toLowerCase();
      list = list.filter((f) => (f.flightNumber || '').toLowerCase().includes(query));
    }

    // Ordenar por fecha y hora de salida
    return list.sort((a, b) => {
      const dateA = (a.date || '') + (a.etd || '');
      const dateB = (b.date || '') + (b.etd || '');
      return dateA.localeCompare(dateB);
    });
  }, [filterMode, filterDay, filterMonth, filterYear, filterFlight]) || [];

  // ---------------------------------------------------------------------------
  // 2.4 AERONAVES FILTRADAS (memoizadas)
  // ---------------------------------------------------------------------------
  const filteredAircrafts = useMemo(() => {
    if (!tailSearchQuery.trim()) return aircraftList;
    
    const query = tailSearchQuery.toLowerCase();
    return aircraftList.filter((ac) =>
      ac.tailNumber?.toLowerCase().includes(query) ||
      ac.model?.toLowerCase().includes(query) ||
      ac.notes?.toLowerCase().includes(query)
    );
  }, [aircraftList, tailSearchQuery]);

  // ---------------------------------------------------------------------------
  // 2.5 HANDLERS MEMOIZADOS
  // ---------------------------------------------------------------------------
  const handleFlightNumberChange = useCallback((val) => {
    const formatted = formatFlightNumber(val);
    setFormData((prev) => ({ ...prev, flightNumber: formatted }));
  }, []);

  const handleRouteChange = useCallback((val) => {
    const formatted = formatRoute(val);
    setFormData((prev) => ({ ...prev, route: formatted }));
  }, []);

  const handleSelectFlight = useCallback((flight) => {
    setEditingFlightId(flight.id);
    setFormData({
      date: flight.date || TODAY_STR,
      flightNumber: flight.flightNumber || 'LA',
      route: flight.route || '',
      tailNumber: flight.tailNumber || '',
      etd: flight.etd || '',
      eta: flight.eta || ''
    });
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingFlightId(null);
    setFormData(initialFormState);
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.flightNumber || formData.flightNumber === 'LA' || !formData.route) {
      alert('Por favor completa el número de vuelo y la ruta.');
      return;
    }

    try {
      if (editingFlightId) {
        await db.flights.update(editingFlightId, {
          flightNumber: formData.flightNumber,
          date: formData.date,
          route: formData.route,
          tailNumber: formData.tailNumber,
          etd: formData.etd || '00:00',
          eta: formData.eta || '00:00',
          synced: false
        });
        setEditingFlightId(null);
      } else {
        const newFlight = {
          id: generateId(),
          flightNumber: formData.flightNumber,
          date: formData.date,
          route: formData.route,
          tailNumber: formData.tailNumber,
          etd: formData.etd || '00:00',
          eta: formData.eta || '00:00',
          atd: '--:--',
          ata: '--:--',
          onPista: '--:--',
          totalPax: 0,
          spndList: [],
          synced: false
        };
        await db.flights.add(newFlight);
      }
      setFormData(initialFormState);
    } catch (err) {
      console.error('Error al guardar vuelo:', err);
    }
  }, [formData, editingFlightId]);

  const confirmDeleteFlight = useCallback(async () => {
    if (!flightToDeleteId) return;

    try {
      await db.flights.delete(flightToDeleteId);
      if (editingFlightId === flightToDeleteId) handleCancelEdit();
    } catch (err) {
      console.error('Error al eliminar vuelo:', err);
    } finally {
      setFlightToDeleteId(null);
    }
  }, [flightToDeleteId, editingFlightId, handleCancelEdit]);

  // Handlers del TimePicker
  const handleOpenTimePicker = useCallback((field, title) => {
    setTimePickerConfig({
      isOpen: true,
      field,
      title
    });
  }, []);

  const handleSaveTime = useCallback((selectedTime) => {
    if (timePickerConfig.field) {
      setFormData((prev) => ({
        ...prev,
        [timePickerConfig.field]: selectedTime
      }));
    }
    setTimePickerConfig((prev) => ({ ...prev, isOpen: false }));
  }, [timePickerConfig.field]);

  const handleCloseTimePicker = useCallback(() => {
    setTimePickerConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  // ---------------------------------------------------------------------------
  // 2.6 RETURN
  // ---------------------------------------------------------------------------
  return {
    formData,
    setFormData,
    editingFlightId,
    flightToDeleteId,
    setFlightToDeleteId,
    isTailModalOpen,
    setIsTailModalOpen,
    tailSearchQuery,
    setTailSearchQuery,
    timePickerConfig,
    handleOpenTimePicker,
    handleSaveTime,
    handleCloseTimePicker,
    filterMode,
    setFilterMode,
    filterDay,
    setFilterDay,
    filterMonth,
    setFilterMonth,
    filterYear,
    setFilterYear,
    filterFlight,
    setFilterFlight,
    flights,
    filteredAircrafts,
    handleFlightNumberChange,
    handleRouteChange,
    handleSelectFlight,
    handleCancelEdit,
    handleSubmit,
    confirmDeleteFlight
  };
}