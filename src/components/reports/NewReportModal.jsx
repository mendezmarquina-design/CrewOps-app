// src/components/reports/NewReportModal.jsx
import React, { useState, useEffect } from 'react';
import { PlusCircle, X, CheckCircle } from 'lucide-react';
import { sanitizeReport } from '../../utils/reportSanitizer';
import { ReportFormFields } from './ReportFormFields';

export function NewReportModal({ isOpen, onClose, onSave, initialCategory = 'Solicitud PAX' }) {
  const [formData, setFormData] = useState(() => sanitizeReport({ category: initialCategory }));

  useEffect(() => {
    if (isOpen) {
      setFormData(sanitizeReport({ category: initialCategory || 'Solicitud PAX' }));
    }
  }, [isOpen, initialCategory]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.titulo?.trim()) return;

    onSave({
      ...formData,
      id: formData.id || `rep_${Date.now()}`,
      createdAt: formData.createdAt || new Date().toISOString()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-cyberCyan/40 rounded-2xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto space-y-4 shadow-2xl text-textMain custom-scrollbar">
        <div className="flex items-center justify-between border-b border-borderCard pb-3">
          <h3 className="text-xs font-black text-cyberCyan uppercase tracking-wider flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Nuevo Reporte de Vuelo
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
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-bgInput text-xs font-bold text-textSub rounded-xl border border-borderCard hover:bg-bgCardHeader transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-cyberCyan hover:bg-cyberCyan/80 text-black text-xs font-black rounded-xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" /> Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}