import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';

export const FLEET_MODELS = ['A319', 'A320', 'A321', '787-8', '787-9'];

export const validateTailNumber = (tail) => /^[A-Z0-9]{2}-[A-Z0-9]{3}$/.test(tail);

export function useAircraftManagement() {
  const [newTail, setNewTail] = useState('');
  const [newModel, setNewModel] = useState('A320');
  const [newNotes, setNewNotes] = useState('');

  const [editingAircraft, setEditingAircraft] = useState(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [pendingImport, setPendingImport] = useState(null);
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [showNewList, setShowNewList] = useState(false);
  const [showExistingList, setShowExistingList] = useState(false);

  const aircrafts = useLiveQuery(() => db.aircrafts.toArray(), []) || [];

  const handleSelectForEdit = (ac) => {
    setEditingAircraft(ac);
    setNewTail(ac.tailNumber);
    setNewModel(ac.model);
    setNewNotes(ac.notes || '');
    setErrorMessage('');
  };

  const handleCancelEdit = () => {
    setEditingAircraft(null);
    setNewTail('');
    setNewModel('A320');
    setNewNotes('');
    setErrorMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    const formattedTail = newTail.trim().toUpperCase();

    if (!validateTailNumber(formattedTail)) {
      setErrorMessage('El formato de la matrícula debe ser XX-XXX (Ej: CC-COO)');
      return;
    }

    if (editingAircraft) {
      if (formattedTail !== editingAircraft.tailNumber) {
        const exists = await db.aircrafts.where('tailNumber').equals(formattedTail).first();
        if (exists) {
          setErrorMessage(`La matrícula ${formattedTail} ya se encuentra registrada por otro avión.`);
          return;
        }
      }
      setShowUpdateModal(true);
    } else {
      const exists = await db.aircrafts.where('tailNumber').equals(formattedTail).first();
      if (exists) {
        setErrorMessage(`La matrícula ${formattedTail} ya se encuentra registrada.`);
        return;
      }

      try {
        await db.aircrafts.add({
          tailNumber: formattedTail,
          model: newModel,
          notes: newNotes.trim()
        });
        handleCancelEdit();
      } catch (error) {
        console.error('Error al guardar matrícula:', error);
        setErrorMessage('No se pudo guardar la matrícula.');
      }
    }
  };

  const confirmUpdate = async () => {
    if (editingAircraft?.id) {
      try {
        await db.aircrafts.update(editingAircraft.id, {
          tailNumber: newTail.trim().toUpperCase(),
          model: newModel,
          notes: newNotes.trim()
        });
        handleCancelEdit();
      } catch (error) {
        console.error('Error al actualizar matrícula:', error);
        setErrorMessage('No se pudieron actualizar los datos.');
      } finally {
        setShowUpdateModal(false);
      }
    }
  };

  const confirmDelete = async () => {
    if (deleteTarget?.id) {
      try {
        await db.aircrafts.delete(deleteTarget.id);
        if (editingAircraft?.id === deleteTarget.id) handleCancelEdit();
      } catch (error) {
        console.error('Error al eliminar:', error);
      } finally {
        setDeleteTarget(null);
      }
    }
  };

  const executeImport = async (data, mode) => {
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
      setErrorMessage('Ocurrió un error al procesar la importación masiva.');
    } finally {
      setPendingImport(null);
      setShowReplaceConfirm(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setErrorMessage('');
        const parsedData = JSON.parse(event.target.result);

        if (!Array.isArray(parsedData)) {
          setErrorMessage('El archivo JSON debe contener un arreglo de objetos.');
          return;
        }

        const formattedData = parsedData.map((item) => ({
          tailNumber: item.tailNumber ? item.tailNumber.trim().toUpperCase() : '',
          model: FLEET_MODELS.includes(item.model) ? item.model : 'A320',
          notes: item.notes ? String(item.notes).trim() : ''
        }));

        const invalidEntry = formattedData.find((a) => !validateTailNumber(a.tailNumber));
        if (invalidEntry) {
          setErrorMessage(`Matrícula inválida: "${invalidEntry.tailNumber || 'N/A'}". Formato requerido: XX-XXX.`);
          return;
        }

        const currentTails = new Set(aircrafts.map((a) => a.tailNumber));
        const newItems = [];
        const existingItems = [];

        formattedData.forEach((item) => {
          if (currentTails.has(item.tailNumber)) existingItems.push(item);
          else newItems.push(item);
        });

        if (aircrafts.length > 0) {
          setPendingImport({ newItems, existingItems, allData: formattedData });
          setShowNewList(false);
          setShowExistingList(false);
        } else {
          await executeImport(formattedData, 'replace');
        }
      } catch (err) {
        setErrorMessage('Error al procesar el archivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const filteredAndSortedAircrafts = aircrafts
    .filter((ac) => {
      const query = searchTerm.toLowerCase();
      return (
        ac.tailNumber.toLowerCase().includes(query) ||
        ac.model.toLowerCase().includes(query) ||
        (ac.notes && ac.notes.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => a.tailNumber.localeCompare(b.tailNumber));

  return {
    newTail, setNewTail,
    newModel, setNewModel,
    newNotes, setNewNotes,
    editingAircraft,
    showUpdateModal, setShowUpdateModal,
    searchTerm, setSearchTerm,
    deleteTarget, setDeleteTarget,
    pendingImport, setPendingImport,
    showReplaceConfirm, setShowReplaceConfirm,
    errorMessage,
    showNewList, setShowNewList,
    showExistingList, setShowExistingList,
    aircrafts,
    filteredAndSortedAircrafts,
    handleSelectForEdit,
    handleCancelEdit,
    handleSubmit,
    confirmUpdate,
    confirmDelete,
    handleFileUpload,
    executeImport
  };
}