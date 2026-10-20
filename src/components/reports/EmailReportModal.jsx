// src/components/reports/EmailReportModal.jsx
import React, { memo } from 'react';
import { Mail, Send, X } from 'lucide-react';

function EmailReportModal({ report, onClose, targetEmail, onEmailChange, onSend }) {
  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-cyberCyan/30 rounded-2xl p-4 max-w-xs w-full space-y-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-borderCard pb-2">
          <h3 className="text-xs font-black text-cyberCyan uppercase flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> Enviar Correo
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-textSub hover:text-textMain cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <input
          type="email"
          value={targetEmail || ''}
          onChange={(e) => onEmailChange(e.target.value)}
          placeholder="correo@empresa.com"
          className="w-full bg-bgInput border border-borderCard rounded-xl p-2.5 text-xs text-textMain"
        />

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-bgInput text-xs text-textSub rounded-xl border border-borderCard cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onSend}
            className="flex-1 py-2 bg-cyberCyan text-black font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md"
          >
            <Send className="w-3.5 h-3.5" /> Enviar
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(EmailReportModal);