import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

// ---------------------------------------------------------------------------
// 1. CONSTANTES Y UTILIDADES (fuera del hook, no se recrean)
// ---------------------------------------------------------------------------
const formatFlightNum = (flight) => {
  if (!flight) return 'N/A';
  const rawNumber = flight.flightNumber || flight.number || '';
  if (rawNumber) {
    return rawNumber.startsWith('LA') ? rawNumber : `LA${rawNumber}`;
  }
  const prefix = flight.flightPrefix || flight.prefix || 'LA';
  const numOnly = flight.flightNumberOnly || '';
  return `${prefix}${numOnly}`;
};

// Fechas actuales (calculadas una sola vez al cargar el módulo)
const NOW = new Date();
const CURRENT_ISO_DATE = NOW.toISOString().split('T')[0];
const CURRENT_ISO_MONTH = CURRENT_ISO_DATE.slice(0, 7);
const CURRENT_ISO_YEAR = CURRENT_ISO_DATE.slice(0, 4);

// ---------------------------------------------------------------------------
// 2. HOOK PRINCIPAL
// ---------------------------------------------------------------------------
export function useGceManagement(activeFlight = null) {
  const isFlightContext = Boolean(activeFlight);
  
  // ---------------------------------------------------------------------------
  // 2.1 ESTADOS AGRUPADOS
  // ---------------------------------------------------------------------------
  const [copiedField, setCopiedField] = useState(null);
  const [activeModalField, setActiveModalField] = useState(null);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    bp: '',
    strengths: '',
    improvements: '',
    qrhReviewed: false,
    qrhNotes: ''
  });

  // Filtros globales
  const [filterType, setFilterType] = useState('Mes');
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState(CURRENT_ISO_DATE);
  const [monthFilter, setMonthFilter] = useState(CURRENT_ISO_MONTH);
  const [yearFilter, setYearFilter] = useState(CURRENT_ISO_YEAR);

  // ---------------------------------------------------------------------------
  // 2.2 CONSULTA OPTIMIZADA A DEXIE (con índice de fecha)
  // ---------------------------------------------------------------------------
  const targetDb = db.gceReports || db.gces;
  
  const dexieGces = useLiveQuery(
    async () => {
      if (!targetDb) return [];
      
      // Si estamos en contexto de vuelo, traer solo los de ese vuelo
      if (isFlightContext && activeFlight?.id) {
        const flightNum = formatFlightNum(activeFlight);
        // Intentar filtrar por flightKey o flightId (si están indexados)
        const byKey = await targetDb.where('flightKey').equals(activeFlight.id).toArray();
        const byId = await targetDb.where('flightId').equals(activeFlight.id).toArray();
        const byNum = await targetDb.where('flightNumber').equals(flightNum).toArray();
        
        // Combinar y eliminar duplicados
        const combined = new Map();
        [...byKey, ...byId, ...byNum].forEach(gce => {
          combined.set(gce.id, gce);
        });
        
        return Array.from(combined.values()).reverse();
      }
      
      // Si no, traer todos (pero podrías filtrar por fecha aquí también)
      return await targetDb.reverse().toArray();
    },
    [isFlightContext, activeFlight?.id, targetDb]
  ) || [];

  // ---------------------------------------------------------------------------
  // 2.3 HANDLERS MEMOIZADOS
  // ---------------------------------------------------------------------------
  const copyToClipboard = useCallback((text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  }, []);

  const resetForm = useCallback(() => {
    setEditingId(null);
    setFormData({
      name: '',
      bp: '',
      strengths: '',
      improvements: '',
      qrhReviewed: false,
      qrhNotes: ''
    });
  }, []);

  const handleSelectForEdit = useCallback((gce) => {
    setEditingId(gce.id);
    setFormData({
      name: gce.name || '',
      bp: gce.bp || '',
      strengths: gce.strengths || '',
      improvements: gce.improvements || '',
      qrhReviewed: Boolean(gce.qrhReviewed),
      qrhNotes: gce.qrhNotes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.bp.trim()) return;
    if (!editingId && !isFlightContext) return;

    const todayIso = CURRENT_ISO_DATE;
    const flightNum = formatFlightNum(activeFlight);

    try {
      if (editingId) {
        await targetDb.update(editingId, {
          name: formData.name.trim(),
          bp: formData.bp.trim(),
          strengths: formData.strengths.trim(),
          improvements: formData.improvements.trim(),
          qrhReviewed: Boolean(formData.qrhReviewed),
          qrhNotes: formData.qrhNotes.trim()
        });
      } else {
        await targetDb.add({
          name: formData.name.trim(),
          bp: formData.bp.trim(),
          strengths: formData.strengths.trim(),
          improvements: formData.improvements.trim(),
          qrhReviewed: Boolean(formData.qrhReviewed),
          qrhNotes: formData.qrhNotes.trim(),
          flightKey: activeFlight?.id || null,
          flightNumber: flightNum,
          date: activeFlight?.date || todayIso,
          createdAt: new Date().toISOString()
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error al guardar GCE:', error);
    }
  }, [formData, editingId, isFlightContext, activeFlight, targetDb, resetForm]);

  const handleDeleteGce = useCallback(async (e, id) => {
    e.stopPropagation();
    if (window.confirm('¿Desea eliminar este registro GCE?')) {
      try {
        await targetDb.delete(id);
        if (editingId === id) resetForm();
      } catch (error) {
        console.error('Error al eliminar GCE:', error);
      }
    }
  }, [editingId, targetDb, resetForm]);

  // ---------------------------------------------------------------------------
  // 2.4 FILTRADO MEMOIZADO
  // ---------------------------------------------------------------------------
  const filteredGces = useMemo(() => {
    let list = Array.isArray(dexieGces) ? [...dexieGces] : [];

    // Si estamos en contexto de vuelo, ya filtramos en la consulta
    if (isFlightContext) {
      return list;
    }

    // Filtrado por búsqueda
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(gce => 
        (gce.name && gce.name.toLowerCase().includes(term)) || 
        (gce.bp && gce.bp.toLowerCase().includes(term)) ||
        (gce.flightNumber && gce.flightNumber.toLowerCase().includes(term))
      );
    }

    // Filtrado por fecha
    if (filterType === 'Día' && dayFilter) {
      list = list.filter(gce => gce.date === dayFilter);
    } else if (filterType === 'Mes' && monthFilter) {
      list = list.filter(gce => gce.date && gce.date.startsWith(monthFilter));
    } else if (filterType === 'Año' && yearFilter) {
      list = list.filter(gce => gce.date && gce.date.startsWith(yearFilter));
    }

    return list;
  }, [dexieGces, isFlightContext, filterType, dayFilter, monthFilter, yearFilter, searchTerm]);

  // ---------------------------------------------------------------------------
  // 2.5 RETURN
  // ---------------------------------------------------------------------------
  return {
    isFlightContext,
    copiedField,
    activeModalField,
    setActiveModalField,
    editingId,
    formData,
    setFormData,
    filterType,
    setFilterType,
    searchTerm,
    setSearchTerm,
    dayFilter,
    setDayFilter,
    monthFilter,
    setMonthFilter,
    yearFilter,
    setYearFilter,
    filteredGces,
    copyToClipboard,
    resetForm,
    handleSelectForEdit,
    handleSubmit,
    handleDeleteGce
  };
}