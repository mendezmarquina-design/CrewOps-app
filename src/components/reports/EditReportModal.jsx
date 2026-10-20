// src/components/reports/EditReportModal.jsx
import React, { useState, useEffect } from 'react';
import { Edit3, X, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { sanitizeReport } from '../../utils/reportSanitizer';
import { ReportFormFields } from './ReportFormFields';

export function EditReportModal({ isOpen, initialData, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen && initialData) {
      setShowConfirmDelete(false);
      setFormData(sanitizeReport(initialData));
    }
  }, [isOpen, initialData]);

  if (!isOpen || !initialData || !formData) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleConfirmDelete = () => {
    if (onDelete) onDelete(formData);
    setShowConfirmDelete(false);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <div className="bg-bgCard border border-cyberCyan/40 rounded-2xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl text-textMain custom-scrollbar">
          <div className="flex items-center justify-between border-b border-borderCard pb-3">
            <h3 className="text-xs font-black text-cyberCyan uppercase tracking-wider flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Editar Reporte
            </h3>
            <button 
              type="button" 
              onClick={onClose} 
              className="text-textSub hover:text-textMain p-1 rounded-lg bg-bgInput transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <ReportFormFields formData={formData} setFormData={setFormData} />

            <div className="flex gap-2 pt-2 border-t border-borderCard/40">
              {onDelete && (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  className="p-2.5 bg-cyberCoral/10 text-cyberCoral hover:bg-cyberCoral/20 border border-cyberCoral/30 rounded-xl cursor-pointer"
                  title="Eliminar Reporte"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-bgInput text-xs font-bold text-textSub rounded-xl border border-borderCard hover:bg-bgCardHeader transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-cyberCyan hover:bg-cyberCyan/80 text-black text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" /> Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de Confirmación de Eliminación */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-bgCard border border-red-500/50 shadow-2xl rounded-2xl p-5 text-textMain space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 border border-red-500/30">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider">¿Eliminar reporte?</h3>
                <p className="text-xs text-textSub mt-0.5">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="p-3 bg-bgInput border border-borderCard rounded-xl space-y-1 text-xs">
              <p className="text-textSub font-mono text-[10px]">REPORTE SELECCIONADO</p>
              <p className="font-bold">{formData.titulo || formData.category}</p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                className="py-2 px-4 rounded-xl border border-borderCard bg-bgInput text-textSub font-bold text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="py-2 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}