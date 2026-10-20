import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

const defaultAircrafts = [
  { tailNumber: 'CC-BBA', model: '787-9', notes: 'Crew Rest Modificado' },
  { tailNumber: 'CC-BER', model: 'A321', notes: 'Air Berlin' },
  { tailNumber: 'CC-BHZ', model: 'A320', notes: 'A320-NEO, Nueva Cabina' },
];

// Helper puro para formatear fechas
export const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1]}-${parts[0]}`;
};

export function useItineraryManagement() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const currentMonthStr = today.toISOString().slice(0, 7);
  const currentYearStr = today.getFullYear().toString();

  const initialFormState = {
    date: todayStr,
    flightNumber: 'LA',
    route: '',
    tailNumber: '',
    etd: '',
    eta: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [editingFlightId, setEditingFlightId] = useState(null);
  const [flightToDeleteId, setFlightToDeleteId] = useState(null);

  // Filtros
  const [filterMode, setFilterMode] = useState('month');
  const [filterDay, setFilterDay] = useState(todayStr);
  const [filterMonth, setFilterMonth] = useState(currentMonthStr);
  const [filterYear, setFilterYear] = useState(currentYearStr);
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

  const handleOpenTimePicker = (field, title) => {
    setTimePickerConfig({
      isOpen: true,
      field,
      title
    });
  };

  const handleSaveTime = (selectedTime) => {
    if (timePickerConfig.field) {
      setFormData((prev) => ({
        ...prev,
        [timePickerConfig.field]: selectedTime
      }));
    }
    setTimePickerConfig((prev) => ({ ...prev, isOpen: false }));
  };

  const handleCloseTimePicker = () => {
    setTimePickerConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // Consulta de Matrículas
  const aircraftList = useLiveQuery(async () => {
    if (!db.aircrafts) return defaultAircrafts;
    const list = await db.aircrafts.toArray();
    return list && list.length > 0 ? list : defaultAircrafts;
  }) || defaultAircrafts;

  // Consulta de Vuelos filtrados
  const flights = useLiveQuery(async () => {
    if (!db.flights) return [];
    let list = await db.flights.toArray();

    if (filterMode === 'day' && filterDay) {
      list = list.filter((f) => f.date === filterDay);
    } else if (filterMode === 'month' && filterMonth) {
      list = list.filter((f) => f.date && f.date.startsWith(filterMonth));
    } else if (filterMode === 'year' && filterYear) {
      list = list.filter((f) => f.date && f.date.startsWith(filterYear));
    }

    if (filterFlight) {
      const query = filterFlight.trim().toLowerCase();
      list = list.filter((f) => (f.flightNumber || '').toLowerCase().includes(query));
    }

    return list.sort((a, b) => {
      const dateA = (a.date || '') + (a.etd || '');
      const dateB = (b.date || '') + (b.etd || '');
      return dateA.localeCompare(dateB);
    });
  }, [filterMode, filterDay, filterMonth, filterYear, filterFlight]) || [];

  // Handlers
  const handleFlightNumberChange = (val) => {
    let clean = val.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!clean.startsWith('LA')) clean = 'LA' + clean.replace(/^[A-Z]*/, '');
    const prefix = clean.slice(0, 2);
    const digits = clean.slice(2).replace(/\D/g, '').slice(0, 4);
    setFormData((prev) => ({ ...prev, flightNumber: prefix + digits }));
  };

  const handleRouteChange = (val) => {
    let clean = val.toUpperCase().replace(/[^A-Z]/g, '');
    if (clean.length > 6) clean = clean.slice(0, 6);
    let formatted = clean;
    if (clean.length > 3) formatted = `${clean.slice(0, 3)}-${clean.slice(3)}`;
    setFormData((prev) => ({ ...prev, route: formatted }));
  };

  const handleSelectFlight = (flight) => {
    setEditingFlightId(flight.id);
    setFormData({
      date: flight.date || todayStr,
      flightNumber: flight.flightNumber || 'LA',
      route: flight.route || '',
      tailNumber: flight.tailNumber || '',
      etd: flight.etd || '',
      eta: flight.eta || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingFlightId(null);
    setFormData(initialFormState);
  };

  const handleSubmit = async (e) => {
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
          id: crypto.randomUUID(),
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
  };

  const confirmDeleteFlight = async () => {
    if (!flightToDeleteId) return;
    try {
      await db.flights.delete(flightToDeleteId);
      if (editingFlightId === flightToDeleteId) handleCancelEdit();
    } catch (err) {
      console.error('Error al eliminar vuelo:', err);
    } finally {
      setFlightToDeleteId(null);
    }
  };

  const filteredAircrafts = aircraftList.filter((ac) =>
    ac.tailNumber?.toLowerCase().includes(tailSearchQuery.toLowerCase()) ||
    ac.model?.toLowerCase().includes(tailSearchQuery.toLowerCase()) ||
    ac.notes?.toLowerCase().includes(tailSearchQuery.toLowerCase())
  );

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