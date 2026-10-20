// src/components/reports/ReportUtilsModals.jsx
import React from 'react';
import { Camera, Upload, Download, Copy, Mail, Send, X } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { encodeToQR, decodeFromQR } from '../../utils/qrEngine';
import { useQrScanner } from '../../hooks/useQrScanner';

export function ImportReportModal({ isOpen, onClose, fileInputRef, onFileUpload, manualJson, onManualJsonChange, onProcessJson }) {
  const qrRegionId = "html5qr-code-full-region";
  const { scanError, stopScanner } = useQrScanner(isOpen, qrRegionId, (decodedData) => {
    onManualJsonChange(typeof decodedData === 'object' ? JSON.stringify(decodedData, null, 2) : decodedData);
  });

  if (!isOpen) return null;

  const handleProcessText = async () => {
    if (!manualJson || !manualJson.trim()) return;
    const result = decodeFromQR(manualJson);
    await stopScanner();
    onProcessJson(result ? JSON.stringify(result.data) : manualJson.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-emerald-500/30 rounded-2xl p-4 max-w-sm w-full space-y-4 relative text-textMain shadow-2xl">
        <button onClick={async () => { await stopScanner(); onClose(); }} className="absolute top-3 right-3 p-1 text-textSub hover:text-textMain bg-bgInput rounded-xl cursor-pointer">
          <X className="w-4 h-4" />
        </button>
        <h3 className="text-xs font-black text-emerald-400 uppercase text-center flex items-center justify-center gap-1.5">
          <Camera className="w-4 h-4" /> Importar / Escanear QR
        </h3>
        <button onClick={() => fileInputRef.current?.click()} className="w-full py-2.5 bg-bgInput border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-bgCardHeader">
          <Upload className="w-3.5 h-3.5" /> Subir JSON
        </button>
        <input type="file" ref={fileInputRef} accept=".json" onChange={onFileUpload} className="hidden" />
        <div className="relative aspect-square bg-black rounded-xl overflow-hidden border border-emerald-500/20 flex items-center justify-center">
          <div id={qrRegionId} className="w-full h-full"></div>
          {scanError && <p className="absolute inset-0 p-4 text-xs text-cyberCoral flex items-center justify-center text-center bg-black/90">{scanError}</p>}
        </div>
        <textarea rows={3} placeholder="Pegar datos aquí..." value={manualJson || ''} onChange={(e) => onManualJsonChange(e.target.value)} className="w-full bg-bgInput border border-borderCard rounded-xl p-2.5 text-xs font-mono resize-none" />
        <button onClick={handleProcessText} className="w-full py-2.5 bg-emerald-600 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md">
          <Download className="w-3.5 h-3.5" /> Procesar
        </button>
      </div>
    </div>
  );
}

export function QrCodeReportModal({ report, onClose, onCopyJson }) {
  if (!report) return null;
  const qrString = encodeToQR('REPORT', report);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-cyberCyan/30 rounded-2xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
        <h3 className="text-xs font-black text-cyberCyan uppercase tracking-wider">Código QR</h3>
        <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
          <QRCodeSVG value={qrString} size={200} level="L" includeMargin />
        </div>
        <button onClick={() => onCopyJson(report)} className="w-full py-2.5 bg-cyberCyan/10 text-cyberCyan text-xs font-bold rounded-xl border border-cyberCyan/30 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-cyberCyan/20">
          <Copy className="w-3.5 h-3.5" /> Copiar JSON
        </button>
        <button onClick={onClose} className="w-full py-2 bg-bgInput text-xs text-textSub rounded-xl cursor-pointer hover:bg-bgCardHeader">
          Cerrar
        </button>
      </div>
    </div>
  );
}

export function EmailReportModal({ report, onClose, targetEmail, onEmailChange, onSend }) {
  if (!report) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-cyberCyan/30 rounded-2xl p-4 max-w-xs w-full space-y-3 shadow-2xl">
        <div className="flex items-center justify-between border-b border-borderCard pb-2">
          <h3 className="text-xs font-black text-cyberCyan uppercase flex items-center gap-1.5">
            <Mail className="w-4 h-4" /> Enviar Correo
          </h3>
          <button onClick={onClose} className="text-textSub hover:text-textMain cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <input type="email" value={targetEmail || ''} onChange={(e) => onEmailChange(e.target.value)} placeholder="correo@empresa.com" className="w-full bg-bgInput border border-borderCard rounded-xl p-2.5 text-xs text-textMain" />
        <div className="flex gap-2 pt-2">
          <button onClick={onClose} className="flex-1 py-2 bg-bgInput text-xs text-textSub rounded-xl border border-borderCard cursor-pointer">Cancelar</button>
          <button onClick={onSend} className="flex-1 py-2 bg-cyberCyan text-black font-black text-xs rounded-xl flex items-center justify-center gap-1 cursor-pointer shadow-md">
            <Send className="w-3.5 h-3.5" /> Enviar
          </button>
        </div>
      </div>
    </div>
  );
}