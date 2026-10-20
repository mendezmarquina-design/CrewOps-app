// src/components/reports/QrCodeReportModal.jsx
import React from 'react';
import { Copy, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { encodeToQR } from '../../utils/qrEngine';
import { sanitizeReport } from '../../utils/reportSanitizer';

export function QrCodeReportModal({ report, onClose, onCopyJson }) {
  if (!report) return null;
  
  // Garantizamos que el reporte esté completo y sanitizado
  const cleanData = sanitizeReport(report);
  const qrString = encodeToQR('REPORT', cleanData);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-cyberCyan/30 rounded-2xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl relative">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 p-1 text-textSub hover:text-textMain bg-bgInput rounded-xl cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xs font-black text-cyberCyan uppercase tracking-wider">Código QR del Reporte</h3>
        
        <div className="bg-white p-3 rounded-xl inline-block shadow-lg">
          <QRCodeSVG 
            value={qrString} 
            size={220} 
            level="L" 
            includeMargin={true}
          />
        </div>

        <div className="space-y-2">
          <button 
            onClick={() => onCopyJson(cleanData)} 
            className="w-full py-2.5 bg-cyberCyan/10 text-cyberCyan text-xs font-bold rounded-xl border border-cyberCyan/30 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-cyberCyan/20"
          >
            <Copy className="w-3.5 h-3.5" /> Copiar Código JSON
          </button>
          
          <button 
            onClick={onClose} 
            className="w-full py-2 bg-bgInput text-xs text-textSub rounded-xl cursor-pointer hover:bg-bgCardHeader"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}