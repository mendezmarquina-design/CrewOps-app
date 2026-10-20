// src/components/reports/EditReportModal.jsx
import React, { useState, useEffect, useCallback, memo } from 'react';
import { X, Edit3, Trash2, CheckCircle2 } from 'lucide-react';
import { sanitizeReport } from '../../utils/reportSanitizer';
import ReportFormFields from './ReportFormFields';

function EditReportModal({ isOpen, initialData, onClose, onSave, onDelete }) {
  const [formData, setFormData] = useState(() => sanitizeReport(initialData));

  useEffect(() => {
    if (isOpen && initialData) {
      setFormData(sanitizeReport(initialData));
    }
  }, [isOpen, initialData]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  }, [formData, onSave, onClose]);

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(formData);
      onClose();
    }
  }, [onDelete, formData, onClose]);

  if (!isOpen || !initialData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-cyberCyan/40 rounded-2xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl text-textMain">
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
                onClick={handleDelete}
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
  );
}

export default memo(EditReportModal);