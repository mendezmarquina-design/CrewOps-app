import React, { useMemo, memo } from 'react';
import { Copy } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { encodeToQR } from '../../utils/qrEngine';

function QrCodeReportModal({ report, onClose, onCopyJson }) {
  // ✅ useMemo para no recalcular el string del QR en cada render
  const qrString = useMemo(() => {
    if (!report) return '';
    return encodeToQR('REPORT', report);
  }, [report]);

  if (!report) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-bgCard border border-cyberCyan/30 rounded-2xl p-5 max-w-xs w-full text-center space-y-4 shadow-2xl">
        <h3 className="text-xs font-black text-cyberCyan uppercase tracking-wider">
          Código QR
        </h3>
        <div className="bg-white p-4 rounded-xl inline-block shadow-lg">
          <QRCodeSVG value={qrString} size={200} level="L" includeMargin />
        </div>
        <button
          type="button"
          onClick={() => onCopyJson(report)}
          className="w-full py-2.5 bg-cyberCyan/10 text-cyberCyan text-xs font-bold rounded-xl border border-cyberCyan/30 flex items-center justify-center gap-1.5 cursor-pointer hover:bg-cyberCyan/20"
        >
          <Copy className="w-3.5 h-3.5" /> Copiar JSON
        </button>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 bg-bgInput text-xs text-textSub rounded-xl cursor-pointer hover:bg-bgCardHeader"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

export default memo(QrCodeReportModal);