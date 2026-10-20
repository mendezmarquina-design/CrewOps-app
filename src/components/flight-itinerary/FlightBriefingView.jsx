import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../db';
import { Save, FileText, Plane, CheckCircle2, AlertCircle, Maximize2, RotateCcw } from 'lucide-react';
import SpndCard from '../common/SpndCard';
import BackButton from '../common/BackButton';
import ExpandedTextareaModal from '../common/ExpandedTextareaModal';
import { buildBriefingPayload } from '../../utils/flightUtils';

export default function FlightBriefingView({ flight, onBack }) {
  const [briefingNotes, setBriefingNotes] = useState(flight?.briefingNotes || '');
  const [spndList, setSpndList] = useState(flight?.spndList || []);
  const [isSaving, setIsSaving] = useState(false);
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [toast, setToast] = useState(null);

  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    if (flight) {
      setBriefingNotes(flight.briefingNotes || '');
      setSpndList(flight.spndList || []);
    }
  }, [flight?.id, flight?.briefingNotes, flight?.spndList]);

  if (!flight) return null;

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => {
      if (isMounted.current) setToast(null);
    }, 3000);
  };

  const isDirty = briefingNotes !== (flight.briefingNotes || '');

  const handleSaveBriefing = async () => {
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
  };

  const handleSaveSpndModal = async (updatedSpndList) => {
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
  };

  return (
    <div className="min-h-screen bg-bgApp text-textMain p-4 font-sans transition-colors duration-200">
      <div className="max-w-xl mx-auto space-y-4 relative pb-8">

        {toast && (
          <div className="fixed top-4 right-4 left-4 max-w-sm mx-auto z-50 animate-in fade-in slide-in-from-top duration-200">
            <div className={`p-3.5 rounded-2xl border flex items-center gap-3 shadow-2xl backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-cyberGreen/10 border-cyberGreen/40 text-cyberGreen' 
                : 'bg-red-500/10 border-red-500/40 text-red-500'
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

        <SpndCard 
          spndList={spndList} 
          onSaveSpnd={handleSaveSpndModal} 
        />

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

        <BackButton onClick={onBack} title="Volver a Control de Vuelos" />

      </div>

      <ExpandedTextareaModal
        isOpen={isNotesModalOpen}
        title="NOTAS BRIEFING DEL VUELO"
        value={briefingNotes}
        onChange={(val) => setBriefingNotes(val)}
        onClose={() => setIsNotesModalOpen(false)}
        placeholder="Escribe aquí meteorología, NOTAMs, aspectos de seguridad del briefing..."
      />
    </div>
  );
}