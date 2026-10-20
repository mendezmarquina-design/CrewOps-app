import { useState, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export const FLEET_MODELS = ['A319', 'A320', 'A321', '787-8', '787-9'];
export const validateTailNumber = (tail) => /^[A-Z0-9]{2}-[A-Z0-9]{3}$/.test(tail);

export function useAircraftManagement() {
  // ---------------------------------------------------------------------------
  // 1. ESTADOS AGRUPADOS (menos useState, más mantenible)
  // ---------------------------------------------------------------------------
  const [formData, setFormData] = useState({
    tail: '',
    model: 'A320',
    notes: ''
  });

  const [editingAircraft, setEditingAircraft] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [uiState, setUiState] = useState({
    showUpdateModal: false,
    showReplaceConfirm: false,
    showNewList: false,
    showExistingList: false,
    errorMessage: ''
  });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);

  // ---------------------------------------------------------------------------
  // 2. CONSULTA A DEXIE (optimizada con ordenamiento en DB)
  // ---------------------------------------------------------------------------
  const aircrafts = useLiveQuery(
    async () => {
      const all = await db.aircrafts.toArray();
      return all.sort((a, b) => a.tailNumber.localeCompare(b.tailNumber));
    },
    []
  ) || [];

  // ---------------------------------------------------------------------------
  // 3. FILTRADO MEMOIZADO (solo recalcula cuando cambian las dependencias)
  // ---------------------------------------------------------------------------
  const filteredAndSortedAircrafts = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return aircrafts
      .filter((ac) => {
        return (
          ac.tailNumber.toLowerCase().includes(query) ||
          ac.model.toLowerCase().includes(query) ||
          (ac.notes && ac.notes.toLowerCase().includes(query))
        );
      })
      .sort((a, b) => a.tailNumber.localeCompare(b.tailNumber));
  }, [aircrafts, searchTerm]);

  // ---------------------------------------------------------------------------
  // 4. HANDLERS MEMOIZADOS (estables entre renders)
  // ---------------------------------------------------------------------------
  const handleSelectForEdit = useCallback((ac) => {
    setEditingAircraft(ac);
    setFormData({
      tail: ac.tailNumber,
      model: ac.model,
      notes: ac.notes || ''
    });
    setUiState((prev) => ({ ...prev, errorMessage: '' }));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingAircraft(null);
    setFormData({
      tail: '',
      model: 'A320',
      notes: ''
    });
    setUiState((prev) => ({ ...prev, errorMessage: '' }));
  }, []);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setUiState((prev) => ({ ...prev, errorMessage: '' }));

    const formattedTail = formData.tail.trim().toUpperCase();
    
    if (!validateTailNumber(formattedTail)) {
      setUiState((prev) => ({
        ...prev,
        errorMessage: 'El formato de la matrícula debe ser XX-XXX (Ej: CC-COO)'
      }));
      return;
    }

    if (editingAircraft) {
      if (formattedTail !== editingAircraft.tailNumber) {
        const exists = await db.aircrafts.where('tailNumber').equals(formattedTail).first();
        if (exists) {
          setUiState((prev) => ({
            ...prev,
            errorMessage: `La matrícula ${formattedTail} ya se encuentra registrada por otro avión.`
          }));
          return;
        }
      }
      setUiState((prev) => ({ ...prev, showUpdateModal: true }));
    } else {
      const exists = await db.aircrafts.where('tailNumber').equals(formattedTail).first();
      if (exists) {
        setUiState((prev) => ({
          ...prev,
          errorMessage: `La matrícula ${formattedTail} ya se encuentra registrada.`
        }));
        return;
      }

      try {
        await db.aircrafts.add({
          tailNumber: formattedTail,
          model: formData.model,
          notes: formData.notes.trim()
        });
        handleCancelEdit();
      } catch (error) {
        console.error('Error al guardar matrícula:', error);
        setUiState((prev) => ({
          ...prev,
          errorMessage: 'No se pudo guardar la matrícula.'
        }));
      }
    }
  }, [formData, editingAircraft, handleCancelEdit]);

  const confirmUpdate = useCallback(async () => {
    if (editingAircraft?.id) {
      try {
        await db.aircrafts.update(editingAircraft.id, {
          tailNumber: formData.tail.trim().toUpperCase(),
          model: formData.model,
          notes: formData.notes.trim()
        });
        handleCancelEdit();
      } catch (error) {
        console.error('Error al actualizar matrícula:', error);
        setUiState((prev) => ({
          ...prev,
          errorMessage: 'No se pudieron actualizar los datos.'
        }));
      } finally {
        setUiState((prev) => ({ ...prev, showUpdateModal: false }));
      }
    }
  }, [editingAircraft, formData, handleCancelEdit]);

  const confirmDelete = useCallback(async () => {
    if (deleteTarget?.id) {
      try {
        await db.aircrafts.delete(deleteTarget.id);
        if (editingAircraft?.id === deleteTarget.id) {
          handleCancelEdit();
        }
      } catch (error) {
        console.error('Error al eliminar:', error);
      } finally {
        setDeleteTarget(null);
      }
    }
  }, [deleteTarget, editingAircraft, handleCancelEdit]);

  const executeImport = useCallback(async (data, mode) => {
    try {
      await db.transaction('rw', db.aircrafts, async () => {
        if (mode === 'replace') {
          await db.aircrafts.clear();
          await db.aircrafts.bulkAdd(data);
        } else if (mode === 'merge') {
          const currentAircraftsMap = new Map(
            (await db.aircrafts.toArray()).map((ac) => [ac.tailNumber, ac.id])
          );
          const itemsToPut = data.map((item) => {
            const existingId = currentAircraftsMap.get(item.tailNumber);
            return existingId ? { ...item, id: existingId } : item;
          });
          await db.aircrafts.bulkPut(itemsToPut);
        }
      });
      handleCancelEdit();
    } catch (error) {
      console.error('Error durante la importación:', error);
      setUiState((prev) => ({
        ...prev,
        errorMessage: 'Ocurrió un error al procesar la importación masiva.'
      }));
    } finally {
      setPendingImport(null);
      setUiState((prev) => ({ ...prev, showReplaceConfirm: false }));
    }
  }, [handleCancelEdit]);

  const handleFileUpload = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setUiState((prev) => ({ ...prev, errorMessage: '' }));
        const parsedData = JSON.parse(event.target.result);
        
        if (!Array.isArray(parsedData)) {
          setUiState((prev) => ({
            ...prev,
            errorMessage: 'El archivo JSON debe contener un arreglo de objetos.'
          }));
          return;
        }

        const formattedData = parsedData.map((item) => ({
          tailNumber: item.tailNumber ? item.tailNumber.trim().toUpperCase() : '',
          model: FLEET_MODELS.includes(item.model) ? item.model : 'A320',
          notes: item.notes ? String(item.notes).trim() : ''
        }));

        const invalidEntry = formattedData.find((a) => !validateTailNumber(a.tailNumber));
        if (invalidEntry) {
          setUiState((prev) => ({
            ...prev,
            errorMessage: `Matrícula inválida: "${invalidEntry.tailNumber || 'N/A'}". Formato requerido: XX-XXX.`
          }));
          return;
        }

        const currentTails = new Set(aircrafts.map((a) => a.tailNumber));
        const newItems = [];
        const existingItems = [];
        
        formattedData.forEach((item) => {
          if (currentTails.has(item.tailNumber)) {
            existingItems.push(item);
          } else {
            newItems.push(item);
          }
        });

        if (aircrafts.length > 0) {
          setPendingImport({ newItems, existingItems, allData: formattedData });
          setUiState((prev) => ({
            ...prev,
            showNewList: false,
            showExistingList: false
          }));
        } else {
          await executeImport(formattedData, 'replace');
        }
      } catch (err) {
        setUiState((prev) => ({
          ...prev,
          errorMessage: 'Error al procesar el archivo JSON.'
        }));
      }
    };
    
    reader.readAsText(file);
    e.target.value = '';
  }, [aircrafts, executeImport]);

  // ---------------------------------------------------------------------------
  // 5. SETTERS INDIVIDUALES (para compatibilidad con componentes existentes)
  // ---------------------------------------------------------------------------
  const setNewTail = useCallback((val) => {
    setFormData((prev) => ({ ...prev, tail: val }));
  }, []);

  const setNewModel = useCallback((val) => {
    setFormData((prev) => ({ ...prev, model: val }));
  }, []);

  const setNewNotes = useCallback((val) => {
    setFormData((prev) => ({ ...prev, notes: val }));
  }, []);

  const setShowUpdateModal = useCallback((val) => {
    setUiState((prev) => ({ ...prev, showUpdateModal: val }));
  }, []);

  const setShowReplaceConfirm = useCallback((val) => {
    setUiState((prev) => ({ ...prev, showReplaceConfirm: val }));
  }, []);

  const setShowNewList = useCallback((val) => {
    setUiState((prev) => ({ ...prev, showNewList: val }));
  }, []);

  const setShowExistingList = useCallback((val) => {
    setUiState((prev) => ({ ...prev, showExistingList: val }));
  }, []);

  // ---------------------------------------------------------------------------
  // 6. RETURN (misma API que antes, compatibilidad total)
  // ---------------------------------------------------------------------------
  return {
    // Form data (con setters individuales para compatibilidad)
    newTail: formData.tail,
    setNewTail,
    newModel: formData.model,
    setNewModel,
    newNotes: formData.notes,
    setNewNotes,

    // Editing state
    editingAircraft,

    // UI state (con setters individuales para compatibilidad)
    showUpdateModal,
    setShowUpdateModal,
    showReplaceConfirm,
    setShowReplaceConfirm,
    showNewList,
    setShowNewList,
    showExistingList,
    setShowExistingList,
    errorMessage: uiState.errorMessage,

    // Search
    searchTerm,
    setSearchTerm,

    // Delete & Import
    deleteTarget,
    setDeleteTarget,
    pendingImport,
    setPendingImport,

    // Data
    aircrafts,
    filteredAndSortedAircrafts,

    // Handlers
    handleSelectForEdit,
    handleCancelEdit,
    handleSubmit,
    confirmUpdate,
    confirmDelete,
    handleFileUpload,
    executeImport
  };
}