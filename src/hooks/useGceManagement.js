import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

// Función auxiliar para formatear correctamente el número de vuelo sin duplicar prefijos "LA"
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

export function useGceManagement(activeFlight = null) {
  const isFlightContext = Boolean(activeFlight);
  const [copiedField, setCopiedField] = useState(null);
  const [activeModalField, setActiveModalField] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // Inicialización dinámica de fecha ISO
  const now = new Date();
  const currentIsoDate = now.toISOString().split('T')[0];
  const currentIsoMonth = currentIsoDate.slice(0, 7);
  const currentIsoYear = currentIsoDate.slice(0, 4);

  const [formData, setFormData] = useState({
    name: '',
    bp: '',
    strengths: '',
    improvements: '',
    qrhReviewed: false,
    qrhNotes: ''
  });

  // Filtros globales sincronizados con la fecha del sistema
  const [filterType, setFilterType] = useState('Mes');
  const [searchTerm, setSearchTerm] = useState('');
  const [dayFilter, setDayFilter] = useState(currentIsoDate);
  const [monthFilter, setMonthFilter] = useState(currentIsoMonth);
  const [yearFilter, setYearFilter] = useState(currentIsoYear);

  // Consulta reactiva a IndexedDB via Dexie
  const dexieGces = useLiveQuery(
    () => (db?.gceReports ? db.gceReports.reverse().toArray() : db?.gces ? db.gces.reverse().toArray() : []),
    []
  );

  const copyToClipboard = (text, fieldName) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: '',
      bp: '',
      strengths: '',
      improvements: '',
      qrhReviewed: false,
      qrhNotes: ''
    });
  };

  const handleSelectForEdit = (gce) => {
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.bp.trim()) return;
    if (!editingId && !isFlightContext) return;

    const todayIso = new Date().toISOString().split('T')[0];
    const flightNum = formatFlightNum(activeFlight);

    try {
      const targetDb = db.gceReports || db.gces;

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
          flightKey: activeFlight.id,
          flightNumber: flightNum,
          date: activeFlight?.date || todayIso,
          createdAt: new Date().toISOString()
        });
      }
      resetForm();
    } catch (error) {
      console.error('Error al guardar GCE:', error);
    }
  };

  const handleDeleteGce = async (e, id) => {
    e.stopPropagation();
    if (window.confirm('¿Desea eliminar este registro GCE?')) {
      const targetDb = db.gceReports || db.gces;
      await targetDb.delete(id);
      if (editingId === id) resetForm();
    }
  };

  const filteredGces = useMemo(() => {
    let list = Array.isArray(dexieGces) ? [...dexieGces] : [];

    if (isFlightContext) {
      const activeNum = formatFlightNum(activeFlight);
      return list.filter(gce => 
        gce.flightKey === activeFlight.id || 
        gce.flightId === activeFlight.id || 
        gce.flightNumber === activeNum
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      list = list.filter(gce => 
        (gce.name && gce.name.toLowerCase().includes(term)) || 
        (gce.bp && gce.bp.toLowerCase().includes(term)) ||
        (gce.flightNumber && gce.flightNumber.toLowerCase().includes(term))
      );
    }

    if (filterType === 'Día' && dayFilter) {
      list = list.filter(gce => gce.date === dayFilter);
    } else if (filterType === 'Mes' && monthFilter) {
      list = list.filter(gce => gce.date && gce.date.startsWith(monthFilter));
    } else if (filterType === 'Año' && yearFilter) {
      list = list.filter(gce => gce.date && gce.date.startsWith(yearFilter));
    }

    return list;
  }, [dexieGces, isFlightContext, activeFlight, filterType, dayFilter, monthFilter, yearFilter, searchTerm]);

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