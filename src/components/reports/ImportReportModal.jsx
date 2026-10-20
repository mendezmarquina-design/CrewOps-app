// src/components/reports/ImportReportModal.jsx
import React, { useCallback, memo } from 'react';
import { Camera, Upload, Download, X } from 'lucide-react';
import { decodeFromQR } from '../../utils/qrEngine';
import { useQrScanner } from '../../hooks/useQrScanner';

function ImportReportModal({
  isOpen,
  onClose,
  fileInputRef,
  onFileUpload,
  manualJson,
  onManualJsonChange,
  onProcessJson
}) {
  const qrRegionId = 'html5qr-code-full-region';

  const handleQrDecoded = useCallback((decodedData) => {
    onManualJsonChange(
      typeof decodedData === 'object' ? JSON.stringify(decodedData, null, 2) : decodedData
    );
  }, [onManualJsonChange]);

  const { scanError, stopScanner } = useQrScanner(isOpen, qrRegionId, handleQrDecoded);

  const handleProcessText = useCallback(async () => {
    if (!manualJson || !manualJson.trim()) return;
    const result = decodeFromQR(manualJson);
    await stopScanner();
    onProcessJson(result ? JSON.stringify(result.data) : manualJson.trim());
  }, [manualJson, stopScanner, onProcessJson]);

  const handleOpenFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, [fileInputRef]);

  const handleCloseWithStop = useCallback(async () => {
    await stopScanner();
    onClose();
  }, [stopScanner, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-emerald-500/30 rounded-2xl p-4 max-w-sm w-full space-y-4 relative text-textMain shadow-2xl">
        <button
          type="button"
          onClick={handleCloseWithStop}
          className="absolute top-3 right-3 p-1 text-textSub hover:text-textMain bg-bgInput rounded-xl cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-xs font-black text-emerald-400 uppercase text-center flex items-center justify-center gap-1.5">
          <Camera className="w-4 h-4" /> Importar / Escanear QR
        </h3>

        <button
          type="button"
          onClick={handleOpenFilePicker}
          className="w-full py-2.5 bg-bgInput border border-emerald-500/30 text-emerald-400 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-bgCardHeader"
        >
          <Upload className="w-3.5 h-3.5" /> Subir JSON
        </button>
        <input
          type="file"
          ref={fileInputRef}
          accept=".json"
          onChange={onFileUpload}
          className="hidden"
        />

        <div className="relative aspect-square bg-black rounded-xl overflow-hidden border border-emerald-500/20 flex items-center justify-center">
          <div id={qrRegionId} className="w-full h-full" />
          {scanError && (
            <p className="absolute inset-0 p-4 text-xs text-cyberCoral flex items-center justify-center text-center bg-black/90">
              {scanError}
            </p>
          )}
        </div>

        <textarea
          rows={3}
          placeholder="Pegar datos aquí..."
          value={manualJson || ''}
          onChange={(e) => onManualJsonChange(e.target.value)}
          className="w-full bg-bgInput border border-borderCard rounded-xl p-2.5 text-xs font-mono resize-none"
        />

        <button
          type="button"
          onClick={handleProcessText}
          className="w-full py-2.5 bg-emerald-600 text-xs font-bold text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
        >
          <Download className="w-3.5 h-3.5" /> Procesar
        </button>
      </div>
    </div>
  );
}

export default memo(ImportReportModal);