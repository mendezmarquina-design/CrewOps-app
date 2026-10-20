// src/components/reports/ImportReportModal.jsx
import React from 'react';
import { Camera, Upload, Download, X } from 'lucide-react';
import { decodeFromQR } from '../../utils/qrEngine';
import { useQrScanner } from '../../hooks/useQrScanner';

export function ImportReportModal({ 
  isOpen, 
  onClose, 
  fileInputRef, 
  onFileUpload, 
  manualJson, 
  onManualJsonChange, 
  onProcessJson 
}) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-bgCard border border-borderCard rounded-2xl p-4 max-w-sm w-full space-y-4 relative text-textPrincipal shadow-sm transition-colors duration-200">
        
        {/* Botón Cerrar */}
        <button 
          onClick={async () => { await stopScanner(); onClose(); }} 
          className="absolute top-3 right-3 p-1.5 text-textSub hover:text-textPrincipal bg-bgInput hover:bg-bgCardHeader rounded-xl cursor-pointer border border-borderCard transition-colors"
          title="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Cabecera */}
        <h3 className="text-xs font-black text-cyberCyan uppercase tracking-wider text-center flex items-center justify-center gap-2">
          <Camera className="w-4 h-4" />
          <span>Importar / Escanear QR</span>
        </h3>

        {/* Botón Cargar JSON */}
        <button 
          onClick={() => fileInputRef.current?.click()} 
          className="w-full py-2.5 bg-bgInput hover:bg-bgCardHeader border border-borderCard text-textPrincipal rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99]"
        >
          <Upload className="w-3.5 h-3.5 text-cyberCyan" />
          <span>Subir Archivo JSON</span>
        </button>
        <input type="file" ref={fileInputRef} accept=".json" onChange={onFileUpload} className="hidden" />

        {/* Visor QR */}
        <div className="relative aspect-square bg-bgInput rounded-xl overflow-hidden border border-borderCard flex items-center justify-center">
          <div id={qrRegionId} className="w-full h-full"></div>
          {scanError && (
            <p className="absolute inset-0 p-4 text-xs text-rose-400 flex items-center justify-center text-center bg-bgCard/90 font-medium">
              {scanError}
            </p>
          )}
        </div>

        {/* Textarea Manual */}
        <textarea 
          rows={3} 
          placeholder="O pega el JSON directamente aquí..." 
          value={manualJson || ''} 
          onChange={(e) => onManualJsonChange(e.target.value)} 
          className="w-full bg-bgInput border border-borderCard focus:border-cyberCyan rounded-xl p-2.5 text-xs font-mono text-textPrincipal placeholder:text-textSub/50 focus:outline-none resize-none transition-all" 
        />

        {/* Botón Procesar */}
        <button 
          onClick={handleProcessText} 
          disabled={!manualJson?.trim()}
          className="w-full py-2.5 bg-cyberPurple hover:opacity-90 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.99] border border-cyberPurpleBorder shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Procesar Reporte</span>
        </button>
      </div>
    </div>
  );
}