import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { db } from '../../db';
import { useLiveQuery } from 'dexie-react-hooks';
import { Save, FileText, Plane, CheckCircle2, AlertCircle, Maximize2, RotateCcw, AlertTriangle } from 'lucide-react';
import SpndCard from '../common/SpndCard';
import BackButton from '../common/BackButton';
import ExpandedTextareaModal from '../common/ExpandedTextareaModal';
import CreateReportCard from './CreateReportCard';
import FlightReportsCard from '../common/FlightReportsCard';
import { EditReportModal } from '../reports';
import { buildBriefingPayload } from '../../utils/flightUtils';

function FlightBriefingView({ flight, onBack }) {
  const [briefingNotes, setBriefingNotes] = useState(flight?.briefingNotes || '');
  const [spndList, setSpndList] = useState(flight?.spndList || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Estado para edición de reportes
  const [editingReport, setEditingReport] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);

  // Estado para modal de eliminación
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, index: null });

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Consulta reactiva del vuelo desde Dexie
  const liveFlight = useLiveQuery(
    async () => {
      if (!flight?.id) return null;
      return await db.flights.get(flight.id);
    },
    [flight?.id],
    flight
  );

  // Sincronizar estados locales cuando cambia el vuelo en vivo
  useEffect(() => {
    if (liveFlight) {
      setBriefingNotes(liveFlight.briefingNotes || '');
      setSpndList(liveFlight.spndList || []);
    }
  }, [liveFlight?.id, liveFlight?.briefingNotes, liveFlight?.spndList]);

  if (!flight) return null;

  const currentReports = liveFlight?.reports || flight?.reports || [];

  const showToast = useCallback((type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      if (isMounted.current) setToast(null);
    }, 3000);
  }, []);

  const isDirty = useMemo(
    () => briefingNotes !== (liveFlight?.briefingNotes || ''),
    [briefingNotes, liveFlight?.briefingNotes]
  );

  const handleSaveBriefing = useCallback(async () => {
    if (!flight?.id) return;
    setIsSaving(true);
    try {
      const payload = buildBriefingPayload(briefingNotes, spndList);
      await db.flights.update(flight.id, payload);
      if (isMounted.current) {
        showToast('success', 'Briefing guardado exitosamente');
      }
    } catch (err) {
      console.error('Error guardando briefing:', err);
      if (isMounted.current) {
        showToast('error', 'Error al guardar el briefing');
      }
    } finally {
      if (isMounted.current) {
        setIsSaving(false);
      }
    }
  }, [flight?.id, briefingNotes, spndList, showToast]);

  const handleSaveSpndModal = useCallback(async (updatedSpndList) => {
    setSpndList(updatedSpndList);
    if (!flight?.id) return;
    try {
      const payload = buildBriefingPayload(briefingNotes, updatedSpndList);
      await db.flights.update(flight.id, payload);
    } catch (err) {
      console.error('Error al actualizar SPND en Dexie:', err);
      if (isMounted.current) {
        showToast('error', 'Error al actualizar los datos de SPND');
      }
    }
  }, [flight?.id, briefingNotes, showToast]);

  const handleUpdateFlightField = useCallback(async (fieldOrUpdates, value) => {
    if (!flight?.id) return;
    const rawUpdates = typeof fieldOrUpdates === 'object' && fieldOrUpdates !== null
      ? fieldOrUpdates
      : { [fieldOrUpdates]: value };
    try {
      await db.flights.update(flight.id, rawUpdates);
    } catch (err) {
      console.error('Error actualizando campo en Dexie DB:', err);
    }
  }, [flight?.id]);

  const handleToggleReportComplete = useCallback((index) => {
    const reports = [...currentReports];
    if (reports[index]) {
      reports[index].completed = !reports[index].completed;
      handleUpdateFlightField('reports', reports);
    }
  }, [currentReports, handleUpdateFlightField]);

  const handleOpenEditReport = useCallback((report, index) => {
    setEditingReport({
      ...report,
      flightNumber: flight?.flightNumber || 'N/A',
      route: flight?.route || 'N/A'
    });
    setEditingIndex(index);
  }, [flight?.flightNumber, flight?.route]);

  const handleSaveEditedReport = useCallback((updatedReport) => {
    if (editingIndex === null) return;
    const reports = [...currentReports];
    reports[editingIndex] = updatedReport;
    handleUpdateFlightField('reports', reports);
    setEditingReport(null);
    setEditingIndex(null);
  }, [editingIndex, currentReports, handleUpdateFlightField]);

  const handleOpenDeleteModal = useCallback((index) => {
    setDeleteModal({ isOpen: true, index });
  }, []);

  const handleCloseDeleteModal = useCallback(() => {
    setDeleteModal({ isOpen: false, index: null });
  }, []);

  const handleConfirmDeleteReport = useCallback(async () => {
    if (deleteModal.index === null) return;
    const reports = [...currentReports];
    reports.splice(deleteModal.index, 1);
    await handleUpdateFlightField('reports', reports);
    setDeleteModal({ isOpen: false, index: null });
    showToast('success', 'Reporte eliminado');
  }, [deleteModal.index, currentReports, handleUpdateFlightField, showToast]);

  return (
    <div className="min-h-screen bg-bgApp text-textMain p-4 font-sans transition-colors duration-200">
      <div className="max-w-xl mx-auto space-y-4 relative pb-8">
        {/* Toast de notificaciones */}
        {toast && (
          <div className="fixed top-4 right-4 left-4 max-w-sm mx-auto z-[100] animate-in fade-in slide-in-from-top duration-200">
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 shadow-2xl backdrop-blur-md ${
              toast.type === 'success' ? 'bg-cyberGreen/10 border-cyberGreen/40 text-cyberGreen' : 'bg-red-500/10 border-red-500/40 text-red-500'
            }`}>
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 shrink-0" />
              )}
              <span className="text-xs font-bold tracking-wide">{toast.message}</span>
            </div>
          </div>
        )}

        <BackButton onClick={onBack} title="Volver a Control de Vuelos" label="REGRESAR" />

        {/* 1. HEADER DEL VUELO */}
        <div className="bg-bgCard border border-borderCard rounded-3xl p-4 shadow-sm flex items-center justify-between text-textMain">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="bg-bgInput border border-borderCard p-3 rounded-2xl shrink-0 flex items-center justify-center text-textPrincipal">
              <Plane className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black tracking-wide text-textPrincipal truncate">
                Vuelo {flight.flightNumber || '---'}
              </h2>
              <p className="text-xs font-mono font-bold text-textSub truncate mt-0.5">
                {flight.route || '---'} &nbsp;|&nbsp; Matrícula: <span className="text-cyberYellow">{flight.tailNumber || '---'}</span>
              </p>
            </div>
          </div>
          <div className="text-right font-mono text-xs space-y-1 shrink-0 pl-3">
            <div className="bg-bgInput px-2.5 py-1 rounded-xl border border-borderCard/60 flex items-center justify-between gap-2">
              <span className="text-[10px] text-textSub font-bold uppercase">ETD</span>
              <span className="text-cyberYellow font-black text-xs">{flight.etd || '--:--'}</span>
            </div>
            <div className="bg-bgInput px-2.5 py-1 rounded-xl border border-borderCard/60 flex items-center justify-between gap-2">
              <span className="text-[10px] text-textSub font-bold uppercase">ETA</span>
              <span className="text-cyberYellow font-black text-xs">{flight.eta || '--:--'}</span>
            </div>
          </div>
        </div>

        {/* 2. NOTAS DEL BRIEFING (movido arriba) */}
        <div className="bg-bgCard border border-borderCard rounded-3xl p-5 space-y-3.5 shadow-sm text-textMain">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-bgInput border border-borderCard text-textPrincipal">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-xs font-black uppercase tracking-wider text-textPrincipal">
                NOTAS BRIEFING
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isDirty && (
                <span className="text-[10px] font-black uppercase tracking-wider text-cyberYellow bg-cyberYellow/10 border border-cyberYellow/30 px-3 py-1 rounded-full">
                  Sin guardar
                </span>
              )}
              <button
                type="button"
                onClick={() => setIsNotesModalOpen(true)}
                className="p-1.5 rounded-xl bg-bgInput hover:bg-bgCardHeader border border-borderCard text-textSub hover:text-textPrincipal transition-all cursor-pointer"
                title="Expandir Pantalla"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div
            onClick={() => setIsNotesModalOpen(true)}
            className="cursor-pointer group relative"
          >
            <textarea
              readOnly
              rows={8}
              value={briefingNotes}
              placeholder="Escribe aquí meteorología, NOTAMs, aspectos de seguridad del briefing..."
              className="w-full bg-bgInput border border-borderCard group-hover:border-textPrincipal/40 rounded-2xl p-4 text-xs text-textMain placeholder:text-textSub/50 font-mono transition-all resize-none leading-relaxed cursor-pointer"
            />
          </div>
        </div>

        {/* 3. BOTÓN DE GUARDADO (movido después de las notas) */}
        <button
          type="button"
          onClick={handleSaveBriefing}
          disabled={isSaving}
          className={`w-full py-3.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-[0.98] uppercase tracking-wider ${
            isSaving
              ? 'bg-bgInput text-textSub border border-borderCard cursor-not-allowed opacity-70'
              : isDirty
                ? 'bg-cyberYellow text-textInverseDark hover:brightness-110 shadow-cyberYellow/20'
                : 'bg-cyberPurple text-white hover:brightness-125 border border-cyberPurpleBorder'
          }`}
        >
          {isSaving ? (
            <RotateCcw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4 stroke-[2.5]" />
          )}
          <span>
            {isSaving
              ? 'Guardando Cambios...'
              : isDirty
                ? 'Guardar Cambios Pendientes'
                : 'Guardar Briefing del Vuelo'}
          </span>
        </button>

        {/* 4. SPND */}
        <SpndCard
          spndList={spndList}
          onSaveSpnd={handleSaveSpndModal}
        />

        {/* 5. REPORTES, NOTAS Y SOLICITUDES (FlightReportsCard) */}
        <FlightReportsCard
          reports={currentReports}
          onToggleComplete={handleToggleReportComplete}
          onEditReport={handleOpenEditReport}
          onDeleteReport={handleOpenDeleteModal}
          defaultOpen={true}
        />

        {/* 6. CREAR NUEVOS REPORTES */}
        <CreateReportCard
          flightData={flight}
          onUpdateFlight={handleUpdateFlightField}
          onDeleteReport={handleOpenDeleteModal}
        />

        <BackButton onClick={onBack} title="Volver a Control de Vuelos" />
      </div>

      {/* Modal de notas expandidas */}
      <ExpandedTextareaModal
        isOpen={isNotesModalOpen}
        title="NOTAS BRIEFING DEL VUELO"
        value={briefingNotes}
        onChange={(val) => setBriefingNotes(val)}
        onClose={() => setIsNotesModalOpen(false)}
        placeholder="Escribe aquí meteorología, NOTAMs, aspectos de seguridad del briefing..."
      />

      {/* Modal de edición de reportes */}
      <EditReportModal
        isOpen={!!editingReport}
        initialData={editingReport}
        onClose={() => {
          setEditingReport(null);
          setEditingIndex(null);
        }}
        onSave={handleSaveEditedReport}
        onDelete={() => {
          if (editingIndex !== null) {
            handleOpenDeleteModal(editingIndex);
            setEditingReport(null);
            setEditingIndex(null);
          }
        }}
      />

      {/* Modal de confirmación de eliminación */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
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
                onClick={handleCloseDeleteModal}
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
    </div>
  );
}

export default memo(FlightBriefingView);